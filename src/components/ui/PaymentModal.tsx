import React, { useState } from 'react'
import { Modal } from './Modal'
import type { PaymentFormData } from '../../types'
import { formatMonth, todayISO, formatCurrency } from '../../lib/utils'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  studentName: string
  month: number
  year: number
  amount: number
  onConfirm: (formData: PaymentFormData) => Promise<void>
}

export function PaymentModal({
  isOpen, onClose, studentName, month, year, amount, onConfirm
}: PaymentModalProps) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState<PaymentFormData>({
    payment_date: todayISO(),
    payment_method: 'cash',
    transaction_reference: '',
  })

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm(form)
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onClose()
        setForm({ payment_date: todayISO(), payment_method: 'cash', transaction_reference: '' })
      }, 1800)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (loading) return
    setSuccess(false)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Mark Payment as Paid">
      {success ? (
        <div className="text-center py-8 space-y-3">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-slate-100">Payment Recorded ✅</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
              {formatCurrency(amount)} for {studentName}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Summary */}
          <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-slate-400">Student</span>
              <span className="font-semibold text-gray-900 dark:text-slate-100">{studentName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-slate-400">Month</span>
              <span className="font-medium text-gray-700 dark:text-slate-300">{formatMonth(month, year)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-slate-400">Amount</span>
              <span className="font-bold text-brand-600 dark:text-brand-400 text-base">{formatCurrency(amount)}</span>
            </div>
          </div>

          {/* Payment Date */}
          <div>
            <label className="form-label">Payment Date</label>
            <input
              type="date"
              className="form-input"
              value={form.payment_date}
              max={todayISO()}
              onChange={e => setForm(f => ({ ...f, payment_date: e.target.value }))}
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="form-label">Payment Method</label>
            <div className="grid grid-cols-2 gap-2">
              {(['cash', 'upi', 'bank_transfer', 'other'] as const).map(method => (
                <label
                  key={method}
                  className={`
                    flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all
                    ${form.payment_method === method
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-400'
                      : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'}
                  `}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value={method}
                    checked={form.payment_method === method}
                    onChange={() => setForm(f => ({ ...f, payment_method: method }))}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0
                    ${form.payment_method === method ? 'border-brand-500' : 'border-gray-300 dark:border-slate-600'}
                  `}>
                    {form.payment_method === method && (
                      <div className="w-2 h-2 rounded-full bg-brand-500" />
                    )}
                  </div>
                  <span className="text-sm font-medium capitalize">
                    {method === 'bank_transfer' ? 'Bank' : method.toUpperCase()}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Transaction Reference */}
          {form.payment_method !== 'cash' && (
            <div>
              <label className="form-label">Transaction Reference <span className="text-gray-400 font-normal">(Optional)</span></label>
              <input
                type="text"
                className="form-input"
                placeholder="UPI ref, UTR no., etc."
                value={form.transaction_reference}
                onChange={e => setForm(f => ({ ...f, transaction_reference: e.target.value }))}
              />
            </div>
          )}

          <button
            onClick={handleConfirm}
            disabled={loading}
            className="btn-primary w-full btn-lg"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Recording...
              </span>
            ) : (
              'Confirm Payment'
            )}
          </button>
        </div>
      )}
    </Modal>
  )
}
