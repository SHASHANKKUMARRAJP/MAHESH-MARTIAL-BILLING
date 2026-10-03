import { useState, useEffect, useCallback } from 'react'
import { supabase, isDemoMode } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Reminder } from '../types'
import { DEMO_REMINDERS } from '../lib/demoData'
import { generateId } from '../lib/utils'
import { getBranchPrefix } from '../lib/branch'

function getStoredReminders(): Reminder[] {
  try {
    const prefix = getBranchPrefix()
    const data = localStorage.getItem(`${prefix}_reminders`)
    if (data) return JSON.parse(data)
  } catch {}
  return [...DEMO_REMINDERS]
}

function saveStoredReminders(reminders: Reminder[]) {
  try {
    const prefix = getBranchPrefix()
    localStorage.setItem(`${prefix}_reminders`, JSON.stringify(reminders))
  } catch {}
}

let demoReminders = getStoredReminders()

export function useReminders(month?: number, year?: number) {
  const { academy } = useAuth()
  const now = new Date()
  const targetMonth = month ?? (now.getMonth() + 1)
  const targetYear = year ?? now.getFullYear()

  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReminders = useCallback(async () => {
    setLoading(true)
    setError(null)

    if (isDemoMode) {
      demoReminders = getStoredReminders()
      const filtered = demoReminders.filter(
        r => r.month === targetMonth && r.year === targetYear
      )
      setReminders(filtered)
      setLoading(false)
      return
    }

    try {
      const academyId = academy?.id ?? 'demo-academy'
      const { data, error: err } = await supabase
        .from('reminders')
        .select('*')
        .eq('academy_id', academyId)
        .eq('month', targetMonth)
        .eq('year', targetYear)
        .order('created_at', { ascending: false })

      if (err) {
        demoReminders = getStoredReminders()
        setReminders(demoReminders.filter(r => r.month === targetMonth && r.year === targetYear))
      } else {
        setReminders((data as Reminder[]) || [])
      }
    } catch {
      demoReminders = getStoredReminders()
      setReminders(demoReminders.filter(r => r.month === targetMonth && r.year === targetYear))
    }
    setLoading(false)
  }, [academy, targetMonth, targetYear])

  useEffect(() => {
    fetchReminders()
  }, [fetchReminders])

  const getReminderForStudent = (studentId: string): Reminder | undefined => {
    return reminders.find(r => r.student_id === studentId)
  }

  const initiateReminder = async (
    studentId: string,
    amount: number,
    message: string
  ): Promise<{ error: string | null; reminderId: string | null }> => {
    const academyId = academy?.id ?? 'demo-academy'
    const id = generateId()

    const existing = demoReminders.find(
      r => r.student_id === studentId && r.month === targetMonth && r.year === targetYear
    )

    if (isDemoMode) {
      if (existing) {
        demoReminders = demoReminders.map(r =>
          r.id === existing.id
            ? { ...r, status: 'pending', initiated_at: null, message }
            : r
        )
        saveStoredReminders(demoReminders)
        await fetchReminders()
        return { error: null, reminderId: existing.id }
      }

      const newReminder: Reminder = {
        id,
        academy_id: academyId,
        student_id: studentId,
        month: targetMonth,
        year: targetYear,
        amount,
        message,
        status: 'pending',
        initiated_at: null,
        created_at: new Date().toISOString(),
      }
      demoReminders = [...demoReminders, newReminder]
      saveStoredReminders(demoReminders)
      await fetchReminders()
      return { error: null, reminderId: id }
    }

    try {
      const { data: existing_db } = await supabase
        .from('reminders')
        .select('id')
        .eq('academy_id', academyId)
        .eq('student_id', studentId)
        .eq('month', targetMonth)
        .eq('year', targetYear)
        .single()

      if (existing_db) {
        await supabase
          .from('reminders')
          .update({ status: 'pending', initiated_at: null, message })
          .eq('id', existing_db.id)
        await fetchReminders()
        return { error: null, reminderId: existing_db.id }
      }

      const { data, error: err } = await supabase
        .from('reminders')
        .insert({
          academy_id: academyId,
          student_id: studentId,
          month: targetMonth,
          year: targetYear,
          amount,
          message,
          status: 'pending',
        })
        .select('id')
        .single()

      if (err) throw err
      await fetchReminders()
      return { error: null, reminderId: data.id }
    } catch {
      if (existing) {
        demoReminders = demoReminders.map(r =>
          r.id === existing.id
            ? { ...r, status: 'pending', initiated_at: null, message }
            : r
        )
      } else {
        const newReminder: Reminder = {
          id,
          academy_id: academyId,
          student_id: studentId,
          month: targetMonth,
          year: targetYear,
          amount,
          message,
          status: 'pending',
          initiated_at: null,
          created_at: new Date().toISOString(),
        }
        demoReminders = [...demoReminders, newReminder]
      }
      saveStoredReminders(demoReminders)
      await fetchReminders()
      return { error: null, reminderId: existing?.id ?? id }
    }
  }

  const confirmReminderSent = async (
    reminderId: string
  ): Promise<{ error: string | null }> => {
    const nowStr = new Date().toISOString()

    demoReminders = demoReminders.map(r =>
      r.id === reminderId
        ? { ...r, status: 'sent', initiated_at: nowStr }
        : r
    )
    saveStoredReminders(demoReminders)

    if (!isDemoMode) {
      try {
        await supabase
          .from('reminders')
          .update({ status: 'sent', initiated_at: nowStr })
          .eq('id', reminderId)
      } catch {}
    }

    await fetchReminders()
    return { error: null }
  }

  const getStudentReminderHistory = useCallback(async (studentId: string): Promise<Reminder[]> => {
    demoReminders = getStoredReminders()
    return demoReminders
      .filter(r => r.student_id === studentId)
      .sort((a, b) => b.year - a.year || b.month - a.month)
  }, [])

  const resetReminder = async (studentId: string): Promise<{ error: string | null }> => {
    demoReminders = demoReminders.map(r =>
      r.student_id === studentId && r.month === targetMonth && r.year === targetYear
        ? { ...r, status: 'pending', initiated_at: null }
        : r
    )
    saveStoredReminders(demoReminders)

    if (!isDemoMode) {
      try {
        await supabase
          .from('reminders')
          .update({ status: 'pending', initiated_at: null })
          .eq('student_id', studentId)
          .eq('month', targetMonth)
          .eq('year', targetYear)
      } catch {}
    }

    await fetchReminders()
    return { error: null }
  }

  return {
    reminders,
    loading,
    error,
    fetchReminders,
    getReminderForStudent,
    initiateReminder,
    confirmReminderSent,
    resetReminder,
    getStudentReminderHistory,
    targetMonth,
    targetYear,
  }
}

