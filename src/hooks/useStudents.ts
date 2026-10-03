import { useState, useEffect, useCallback } from 'react'
import { supabase, isDemoMode } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Student, StudentFormData } from '../types'
import { DEMO_STUDENTS } from '../lib/demoData'
import { generateId } from '../lib/utils'
import { getBranchPrefix, getActiveBranch } from '../lib/branch'

function getStoredStudents(): Student[] {
  try {
    const prefix = getBranchPrefix()
    const data = localStorage.getItem(`${prefix}_students`)
    if (data) return JSON.parse(data)
  } catch {}
  return []
}

function saveStoredStudents(students: Student[]) {
  try {
    const prefix = getBranchPrefix()
    localStorage.setItem(`${prefix}_students`, JSON.stringify(students))
  } catch {}
}

let demoStudents = getStoredStudents()

export function useStudents() {
  const { academy } = useAuth()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStudents = useCallback(async () => {
    setLoading(true)
    setError(null)

    if (isDemoMode) {
      demoStudents = getStoredStudents()
      setStudents([...demoStudents])
      setLoading(false)
      return
    }

    try {
      const academyId = academy?.id
      if (!academyId || academyId === 'demo-academy') {
        setStudents([])
        setLoading(false)
        return
      }

      const { data, error: err } = await supabase
        .from('students')
        .select('*')
        .eq('academy_id', academyId)
        .order('student_name')

      if (err) {
        setError(err.message)
        setStudents([])
      } else {
        const branch = getActiveBranch() || 'branch1'
        const filtered = (data as Student[]).filter(s => {
          const sBranch = s.photo_url || 'branch1'
          return sBranch === branch
        })
        setStudents(filtered)
      }
    } catch (e: any) {
      setError(e.message)
      setStudents([])
    }
    setLoading(false)
  }, [academy])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  const addStudent = async (formData: StudentFormData): Promise<{ error: string | null }> => {
    const academyId = academy?.id
    if (!academyId || academyId === 'demo-academy') {
      return { error: 'Academy profile not loaded. Try refreshing the page.' }
    }
    
    const normalized = formData.parent_phone.replace(/\D/g, '')
    const phone = normalized.length === 10 ? `91${normalized}` : normalized

    const newStudent: Student = {
      id: generateId(),
      academy_id: academyId,
      student_name: formData.student_name.trim(),
      parent_name: formData.parent_name.trim(),
      parent_phone: phone,
      monthly_fee: formData.monthly_fee,
      batch: formData.batch || null,
      joining_date: formData.joining_date || null,
      photo_url: null,
      status: formData.status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    if (isDemoMode) {
      demoStudents = [newStudent, ...demoStudents]
      saveStoredStudents(demoStudents)
      setStudents([...demoStudents])
      return { error: null }
    }

    try {
      const branch = getActiveBranch() || 'branch1'
      const { error: err } = await supabase.from('students').insert({
        academy_id: academyId,
        student_name: newStudent.student_name,
        parent_name: newStudent.parent_name,
        parent_phone: newStudent.parent_phone,
        monthly_fee: newStudent.monthly_fee,
        batch: newStudent.batch,
        joining_date: newStudent.joining_date,
        status: newStudent.status,
        photo_url: branch,
      })

      if (err) {
        return { error: err.message }
      }
      await fetchStudents()
      return { error: null }
    } catch (e: any) {
      return { error: e.message }
    }
  }

  const updateStudent = async (
    id: string,
    formData: Partial<StudentFormData>
  ): Promise<{ error: string | null }> => {
    if (isDemoMode) {
      demoStudents = demoStudents.map(s =>
        s.id === id
          ? { ...s, ...formData, parent_phone: formData.parent_phone ? normalizePhone(formData.parent_phone) : s.parent_phone, updated_at: new Date().toISOString() }
          : s
      )
      saveStoredStudents(demoStudents)
      setStudents([...demoStudents])
      return { error: null }
    }

    const updateData: Record<string, unknown> = { ...formData, updated_at: new Date().toISOString() }
    if (formData.parent_phone) {
      updateData.parent_phone = normalizePhone(formData.parent_phone)
    }

    const branch = getActiveBranch() || 'branch1'
    const { error: err } = await supabase
      .from('students')
      .update({ ...updateData, photo_url: branch })
      .eq('id', id)

    if (err) return { error: err.message }
    await fetchStudents()
    return { error: null }
  }

  const deleteStudent = async (id: string): Promise<{ error: string | null }> => {
    if (isDemoMode) {
      demoStudents = demoStudents.filter(s => s.id !== id)
      saveStoredStudents(demoStudents)
      setStudents([...demoStudents])
      return { error: null }
    }

    const { error: err } = await supabase.from('students').delete().eq('id', id)
    if (err) return { error: err.message }
    await fetchStudents()
    return { error: null }
  }

  const getStudent = (id: string): Student | undefined => {
    return students.find(s => s.id === id)
  }

  return {
    students,
    loading,
    error,
    fetchStudents,
    addStudent,
    updateStudent,
    deleteStudent,
    getStudent,
  }
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) return `91${digits}`
  return digits
}

