import { useState, useEffect, useCallback } from 'react'
import { supabase, isDemoMode } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Payment, PaymentFormData } from '../types'
import { DEMO_PAYMENTS } from '../lib/demoData'
import { generateId, getCurrentMonth } from '../lib/utils'

function getStoredPayments(): Payment[] {
  try {
    const data = localStorage.getItem('karate_payments')
    if (data) return JSON.parse(data)
  } catch {}
  return [...DEMO_PAYMENTS]
}

function saveStoredPayments(payments: Payment[]) {
  try {
    localStorage.setItem('karate_payments', JSON.stringify(payments))
  } catch {}
}

let demoPayments = getStoredPayments()

function getStoredStudents() {
  try {
    const data = localStorage.getItem('karate_students')
    if (data) return JSON.parse(data)
  } catch {}
  return []
}

export function usePayments(month?: number, year?: number) {
  const { academy } = useAuth()
  const currentPeriod = getCurrentMonth()
  const targetMonth = month ?? currentPeriod.month
  const targetYear = year ?? currentPeriod.year

  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const autoEnsureActiveStudentFees = useCallback((targetM: number, targetY: number) => {
    demoPayments = getStoredPayments()
    const storedStus = getStoredStudents() as any[]
    const activeStus = storedStus.filter(s => s.status === 'active')

    let updated = false
    activeStus.forEach(stu => {
      const exists = demoPayments.some(
        p => p.student_id === stu.id && p.month === targetM && p.year === targetY
      )
      if (!exists) {
        demoPayments.push({
          id: generateId(),
          academy_id: academy?.id || 'demo-academy',
          student_id: stu.id,
          month: targetM,
          year: targetY,
          amount: stu.monthly_fee,
          status: 'pending',
          payment_date: null,
          payment_method: null,
          transaction_reference: null,
          created_at: new Date().toISOString(),
        })
        updated = true
      }
    })

    if (updated) {
      saveStoredPayments(demoPayments)
    }
  }, [academy])

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    setError(null)

    autoEnsureActiveStudentFees(targetMonth, targetYear)

    if (isDemoMode) {
      demoPayments = getStoredPayments()
      const filtered = demoPayments.filter(
        p => p.month === targetMonth && p.year === targetYear
      )
      setPayments(filtered)
      setLoading(false)
      return
    }

    try {
      const academyId = academy?.id ?? 'demo-academy'
      let query = supabase
        .from('payments')
        .select('*')
        .eq('academy_id', academyId)
        .eq('month', targetMonth)
        .eq('year', targetYear)
        .order('created_at', { ascending: false })

      const { data, error: err } = await query
      if (err) {
        demoPayments = getStoredPayments()
        setPayments(demoPayments.filter(p => p.month === targetMonth && p.year === targetYear))
      } else {
        setPayments((data as Payment[]) || [])
      }
    } catch {
      demoPayments = getStoredPayments()
      setPayments(demoPayments.filter(p => p.month === targetMonth && p.year === targetYear))
    }
    setLoading(false)
  }, [academy, targetMonth, targetYear, autoEnsureActiveStudentFees])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  const getPaymentForStudent = (studentId: string): Payment | undefined => {
    return payments.find(p => p.student_id === studentId)
  }

  const markPaid = async (
    studentId: string,
    amount: number,
    formData: PaymentFormData
  ): Promise<{ error: string | null }> => {
    const academyId = academy?.id ?? 'demo-academy'
    const existing = demoPayments.find(
      p => p.student_id === studentId && p.month === targetMonth && p.year === targetYear
    )

    if (isDemoMode) {
      if (existing) {
        demoPayments = demoPayments.map(p =>
          p.id === existing.id
            ? { ...p, status: 'paid', payment_date: formData.payment_date, payment_method: formData.payment_method, transaction_reference: formData.transaction_reference || null }
            : p
        )
      } else {
        const newPayment: Payment = {
          id: generateId(),
          academy_id: academyId,
          student_id: studentId,
          month: targetMonth,
          year: targetYear,
          amount,
          status: 'paid',
          payment_date: formData.payment_date,
          payment_method: formData.payment_method,
          transaction_reference: formData.transaction_reference || null,
          created_at: new Date().toISOString(),
        }
        demoPayments = [...demoPayments, newPayment]
      }
      saveStoredPayments(demoPayments)
      await fetchPayments()
      return { error: null }
    }

    try {
      const { data: existing_db } = await supabase
        .from('payments')
        .select('id')
        .eq('academy_id', academyId)
        .eq('student_id', studentId)
        .eq('month', targetMonth)
        .eq('year', targetYear)
        .single()

      if (existing_db) {
        const { error: err } = await supabase
          .from('payments')
          .update({
            status: 'paid',
            payment_date: formData.payment_date,
            payment_method: formData.payment_method,
            transaction_reference: formData.transaction_reference || null,
          })
          .eq('id', existing_db.id)
        if (err) throw err
      } else {
        const { error: err } = await supabase.from('payments').insert({
          academy_id: academyId,
          student_id: studentId,
          month: targetMonth,
          year: targetYear,
          amount,
          status: 'paid',
          payment_date: formData.payment_date,
          payment_method: formData.payment_method,
          transaction_reference: formData.transaction_reference || null,
        })
        if (err) throw err
      }
      await fetchPayments()
      return { error: null }
    } catch {
      // Fallback local save
      if (existing) {
        demoPayments = demoPayments.map(p =>
          p.id === existing.id
            ? { ...p, status: 'paid', payment_date: formData.payment_date, payment_method: formData.payment_method, transaction_reference: formData.transaction_reference || null }
            : p
        )
      } else {
        const newPayment: Payment = {
          id: generateId(),
          academy_id: academyId,
          student_id: studentId,
          month: targetMonth,
          year: targetYear,
          amount,
          status: 'paid',
          payment_date: formData.payment_date,
          payment_method: formData.payment_method,
          transaction_reference: formData.transaction_reference || null,
          created_at: new Date().toISOString(),
        }
        demoPayments = [...demoPayments, newPayment]
      }
      saveStoredPayments(demoPayments)
      await fetchPayments()
      return { error: null }
    }
  }

  const ensurePaymentRecord = async (studentId: string, amount: number) => {
    const exists = demoPayments.some(
      p => p.student_id === studentId && p.month === targetMonth && p.year === targetYear
    )
    if (!exists) {
      demoPayments.push({
        id: generateId(),
        academy_id: academy?.id || 'demo-academy',
        student_id: studentId,
        month: targetMonth,
        year: targetYear,
        amount,
        status: 'pending',
        payment_date: null,
        payment_method: null,
        transaction_reference: null,
        created_at: new Date().toISOString(),
      })
      saveStoredPayments(demoPayments)
    }
  }

  const getStudentPaymentHistory = useCallback(async (studentId: string): Promise<Payment[]> => {
    demoPayments = getStoredPayments()
    return demoPayments
      .filter(p => p.student_id === studentId)
      .sort((a, b) => b.year - a.year || b.month - a.month)
  }, [])

  const markPending = async (studentId: string): Promise<{ error: string | null }> => {
    const academyId = academy?.id ?? 'demo-academy'
    
    // Update local state fallback
    demoPayments = demoPayments.map(p =>
      p.student_id === studentId && p.month === targetMonth && p.year === targetYear
        ? { ...p, status: 'pending', payment_date: null, payment_method: null, transaction_reference: null }
        : p
    )
    saveStoredPayments(demoPayments)

    if (!isDemoMode) {
      try {
        const { data: existing_db } = await supabase
          .from('payments')
          .select('id')
          .eq('academy_id', academyId)
          .eq('student_id', studentId)
          .eq('month', targetMonth)
          .eq('year', targetYear)
          .single()

        if (existing_db) {
          const { error: err } = await supabase
            .from('payments')
            .update({
              status: 'pending',
              payment_date: null,
              payment_method: null,
              transaction_reference: null,
            })
            .eq('id', existing_db.id)
            
          if (err) return { error: err.message }
        }
      } catch (err: any) {
        return { error: err.message }
      }
    }

    await fetchPayments()
    return { error: null }
  }

  return {
    payments,
    loading,
    error,
    fetchPayments,
    getPaymentForStudent,
    markPaid,
    markPending,
    ensurePaymentRecord,
    getStudentPaymentHistory,
    targetMonth,
    targetYear,
  }
}
