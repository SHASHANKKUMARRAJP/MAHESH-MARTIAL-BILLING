import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import type { StudentFormData, Student } from '../../types'
import { validateIndianPhone, todayISO } from '../../lib/utils'

const BATCHES = ['Beginners', 'Intermediate', 'Advanced', 'Competition', 'Kids']

interface StudentFormProps {
  initial?: Student
  defaultFee?: number
  onSubmit: (data: StudentFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

interface FormErrors {
  student_name?: string
  parent_name?: string
  parent_phone?: string
  monthly_fee?: string
}

export function StudentForm({ initial, defaultFee = 800, onSubmit, onCancel, loading }: StudentFormProps) {
  const [form, setForm] = useState<StudentFormData>({
    student_name: initial?.student_name ?? '',
    parent_name: initial?.parent_name ?? '',
    parent_phone: initial?.parent_phone
      ? (initial.parent_phone.startsWith('91') ? initial.parent_phone.slice(2) : initial.parent_phone)
      : '',
    monthly_fee: initial?.monthly_fee ?? defaultFee,
    batch: initial?.batch ?? '',
    joining_date: initial?.joining_date ?? todayISO(),
    status: initial?.status ?? 'active',
  })
  const [errors, setErrors] = useState<FormErrors>({})

  const validate = (): boolean => {
    const e: FormErrors = {}
    if (!form.student_name.trim()) e.student_name = 'Student name is required'
    if (!form.parent_name.trim()) e.parent_name = 'Parent name is required'
    if (!form.parent_phone.trim()) {
      e.parent_phone = 'WhatsApp number is required'
    } else if (!validateIndianPhone(form.parent_phone)) {
      e.parent_phone = 'Enter a valid 10-digit Indian mobile number'
    }
    if (!form.monthly_fee || form.monthly_fee <= 0) {
      e.monthly_fee = 'Enter a valid fee amount'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    await onSubmit(form)
  }

  const field = (
    id: string,
    label: string,
    type: string,
    value: string | number,
    onChange: (v: string) => void,
    options?: { required?: boolean; placeholder?: string; error?: string; prefix?: string }
  ) => (
    <div>
      <label htmlFor={id} className="form-label">
        {label} {options?.required && <span className="text-red-500">*</span>}
      </label>
      <div className={options?.prefix ? 'flex' : ''}>
        {options?.prefix && (
          <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700 text-gray-500 dark:text-slate-400 text-sm font-medium">
            {options.prefix}
          </span>
        )}
        <input
          id={id}
          type={type}
          className={`form-input ${options?.prefix ? 'rounded-l-none' : ''} ${options?.error ? 'border-red-400 focus:ring-red-400' : ''}`}
          placeholder={options?.placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      </div>
      {options?.error && <p className="form-error">{options.error}</p>}
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {field(
        'student_name', 'Student Name', 'text', form.student_name,
        v => setForm(f => ({ ...f, student_name: v })),
        { required: true, placeholder: 'e.g. Rahul Kumar', error: errors.student_name }
      )}

      {field(
        'parent_name', 'Parent Name', 'text', form.parent_name,
        v => setForm(f => ({ ...f, parent_name: v })),
        { required: true, placeholder: 'e.g. Suresh Kumar', error: errors.parent_name }
      )}

      <div>
        <label htmlFor="parent_phone" className="form-label">
          Parent WhatsApp Number <span className="text-red-500">*</span>
        </label>
        <div className="flex">
          <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700 text-gray-500 dark:text-slate-400 text-sm font-medium">
            +91
          </span>
          <input
            id="parent_phone"
            type="tel"
            className={`form-input rounded-l-none ${errors.parent_phone ? 'border-red-400 focus:ring-red-400' : ''}`}
            placeholder="98765 43210"
            value={form.parent_phone}
            maxLength={10}
            onChange={e => setForm(f => ({ ...f, parent_phone: e.target.value.replace(/\D/g, '') }))}
          />
        </div>
        {errors.parent_phone
          ? <p className="form-error">{errors.parent_phone}</p>
          : <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Used for WhatsApp fee reminders</p>
        }
      </div>

      <div>
        <label htmlFor="monthly_fee" className="form-label">
          Monthly Fee <span className="text-red-500">*</span>
        </label>
        <div className="flex">
          <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700 text-gray-500 dark:text-slate-400 text-sm font-semibold">
            ₹
          </span>
          <input
            id="monthly_fee"
            type="number"
            className={`form-input rounded-l-none ${errors.monthly_fee ? 'border-red-400 focus:ring-red-400' : ''}`}
            placeholder="800"
            value={form.monthly_fee}
            min={1}
            onChange={e => setForm(f => ({ ...f, monthly_fee: Number(e.target.value) }))}
          />
        </div>
        {errors.monthly_fee && <p className="form-error">{errors.monthly_fee}</p>}
      </div>

      <div>
        <label htmlFor="batch" className="form-label">Batch</label>
        <select
          id="batch"
          className="form-select"
          value={form.batch}
          onChange={e => setForm(f => ({ ...f, batch: e.target.value }))}
        >
          <option value="">Select batch</option>
          {BATCHES.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      <div>
        <label htmlFor="joining_date" className="form-label">Joining Date</label>
        <input
          id="joining_date"
          type="date"
          className="form-input"
          value={form.joining_date}
          onChange={e => setForm(f => ({ ...f, joining_date: e.target.value }))}
        />
      </div>

      <div>
        <label className="form-label">Status</label>
        <div className="flex gap-3">
          {(['active', 'inactive'] as const).map(s => (
            <label key={s} className={`
              flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer flex-1 justify-center transition-all
              ${form.status === s
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-400'
                : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:border-gray-300'}
            `}>
              <input
                type="radio"
                name="status"
                value={s}
                checked={form.status === s}
                onChange={() => setForm(f => ({ ...f, status: s }))}
                className="sr-only"
              />
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center
                ${form.status === s ? 'border-brand-500' : 'border-gray-300 dark:border-slate-600'}
              `}>
                {form.status === s && <div className="w-2 h-2 rounded-full bg-brand-500" />}
              </div>
              <span className="text-sm font-medium capitalize">{s}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading
            ? <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </span>
            : (initial ? 'Save Changes' : 'Add Student')
          }
        </button>
      </div>
    </form>
  )
}
