import React, { useState } from 'react'
import type { ExpenseFormData, Expense } from '../../types'
import { todayISO } from '../../lib/utils'

interface ExpenseFormProps {
  initial?: Expense
  onSubmit: (data: ExpenseFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export function ExpenseForm({ initial, onSubmit, onCancel, loading }: ExpenseFormProps) {
  const [formData, setFormData] = useState<ExpenseFormData>({
    title: initial?.title ?? '',
    amount: initial?.amount ?? 0,
    category: initial?.category ?? 'electricity',
    expense_date: initial?.expense_date ?? todayISO(),
    notes: initial?.notes ?? ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="form-label">Expense Title</label>
        <select
          className="form-input"
          value={formData.title || 'Rent'}
          onChange={e => setFormData(f => ({ ...f, title: e.target.value, category: e.target.value }))}
        >
          <option value="Rent">Rent</option>
          <option value="Electricity">Electricity</option>
          <option value="Maintenance">Maintenance</option>
          <option value="Equipment">Equipment</option>
          <option value="Salary">Salary</option>
          <option value="Marketing">Marketing</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">Amount (₹)</label>
          <input
            type="number"
            required
            min="0"
            className="form-input"
            value={formData.amount === 0 ? '' : formData.amount}
            onChange={e => setFormData(f => ({ ...f, amount: e.target.value ? Number(e.target.value) : 0 }))}
          />
        </div>
        <div>
          <label className="form-label">Date</label>
          <input
            type="date"
            required
            className="form-input"
            value={formData.expense_date}
            onChange={e => setFormData(f => ({ ...f, expense_date: e.target.value }))}
          />
        </div>
      </div>

      <div>
        <label className="form-label">Notes (Optional)</label>
        <textarea
          className="form-input resize-none"
          rows={2}
          value={formData.notes}
          onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))}
        />
      </div>

      <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? 'Saving...' : initial ? 'Save Changes' : 'Add Expense'}
        </button>
      </div>
    </form>
  )
}
