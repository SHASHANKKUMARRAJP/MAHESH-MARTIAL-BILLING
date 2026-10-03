import { useState, useEffect, useCallback } from 'react'
import { supabase, isDemoMode } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Expense, ExpenseFormData } from '../types'
import { generateId } from '../lib/utils'
import { getBranchPrefix } from '../lib/branch'

function getStoredExpenses(): Expense[] {
  try {
    const prefix = getBranchPrefix()
    const data = localStorage.getItem(`${prefix}_expenses`)
    if (data) return JSON.parse(data)
  } catch {}
  return []
}

function saveStoredExpenses(expenses: Expense[]) {
  try {
    const prefix = getBranchPrefix()
    localStorage.setItem(`${prefix}_expenses`, JSON.stringify(expenses))
  } catch {}
}

let demoExpenses = getStoredExpenses()

export function useExpenses() {
  const { academy } = useAuth()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  const fetchExpenses = useCallback(async () => {
    setLoading(true)
    if (isDemoMode) {
      demoExpenses = getStoredExpenses()
      setExpenses(demoExpenses)
      setLoading(false)
      return
    }

    try {
      const academyId = academy?.id ?? 'demo-academy'
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('academy_id', academyId)
        .order('expense_date', { ascending: false })

      if (error) {
        setExpenses(getStoredExpenses())
      } else {
        setExpenses((data as Expense[]) || [])
      }
    } catch {
      setExpenses(getStoredExpenses())
    }
    setLoading(false)
  }, [academy])

  useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

  const addExpense = async (formData: ExpenseFormData): Promise<{ error: string | null }> => {
    const academyId = academy?.id
    if (!academyId || academyId === 'demo-academy') {
      return { error: 'Academy profile not loaded. Try refreshing the page.' }
    }

    const newExpense: Omit<Expense, 'id' | 'created_at'> = {
      academy_id: academyId,
      ...formData
    }

    if (isDemoMode) {
      const e: Expense = {
        id: generateId(),
        ...newExpense,
        created_at: new Date().toISOString(),
      }
      demoExpenses = [e, ...demoExpenses]
      saveStoredExpenses(demoExpenses)
      setExpenses([...demoExpenses])
      return { error: null }
    }

    const { error } = await supabase.from('expenses').insert(newExpense)
    if (error) return { error: error.message }
    
    await fetchExpenses()
    return { error: null }
  }

  const updateExpense = async (id: string, formData: ExpenseFormData): Promise<{ error: string | null }> => {
    if (isDemoMode) {
      demoExpenses = demoExpenses.map(e => (e.id === id ? { ...e, ...formData } : e))
      saveStoredExpenses(demoExpenses)
      setExpenses([...demoExpenses])
      return { error: null }
    }

    const { error } = await supabase.from('expenses').update(formData).eq('id', id)
    if (error) return { error: error.message }

    await fetchExpenses()
    return { error: null }
  }

  const deleteExpense = async (id: string): Promise<{ error: string | null }> => {
    if (isDemoMode) {
      demoExpenses = demoExpenses.filter(e => e.id !== id)
      saveStoredExpenses(demoExpenses)
      setExpenses([...demoExpenses])
      return { error: null }
    }

    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (error) return { error: error.message }

    await fetchExpenses()
    return { error: null }
  }

  return {
    expenses,
    loading,
    addExpense,
    updateExpense,
    deleteExpense,
    fetchExpenses
  }
}
