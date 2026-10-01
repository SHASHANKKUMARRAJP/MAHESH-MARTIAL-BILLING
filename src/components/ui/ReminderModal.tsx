import React, { useState } from 'react'
import { MessageCircle, CheckCircle, X } from 'lucide-react'
import { Modal } from './Modal'
import type { Student } from '../../types'
import {
  formatMonth, buildWhatsAppMessage, buildWhatsAppLink,
  formatCurrency, displayPhone,
} from '../../lib/utils'

export interface ReminderQueueItem {
  student: Student
  reminderId: string | null
  message: string
  sent: boolean
}

interface ReminderModalProps {
  isOpen: boolean
  onClose: () => void
  queue: ReminderQueueItem[]
  month: number
  year: number
  onMarkSent: (index: number) => Promise<void>
  onCancel: (index: number) => void
}

export function ReminderModal({
  isOpen, onClose, queue, month, year, onMarkSent, onCancel,
}: ReminderModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [confirmStep, setConfirmStep] = useState<'idle' | 'opened' | 'loading'>('idle')

  const sentCount = queue.filter(q => q.sent).length
  const total = queue.length
  const isComplete = sentCount === total
  const current = queue[currentIndex]

  const handleOpenAndMarkSent = async () => {
    if (!current) return
    const link = buildWhatsAppLink(current.student.parent_phone, current.message)
    window.open(link, '_blank')
    await onMarkSent(currentIndex)
    setConfirmStep('idle')
    if (currentIndex < total - 1) {
      setCurrentIndex(i => i + 1)
    }
  }

  const handleSkipThis = () => {
    onCancel(currentIndex)
    setConfirmStep('idle')
    if (currentIndex < total - 1) {
      setCurrentIndex(i => i + 1)
    }
  }

  const handleClose = () => {
    setCurrentIndex(0)
    setConfirmStep('idle')
    onClose()
  }

  const handleOpenAllAtOnce = async () => {
    setConfirmStep('loading')
    for (let i = 0; i < queue.length; i++) {
      const item = queue[i]
      const link = buildWhatsAppLink(item.student.parent_phone, item.message)
      window.open(link, '_blank')
      await onMarkSent(i)
    }
    setConfirmStep('idle')
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Send Fee Reminders">
      {isComplete ? (
        <div className="text-center py-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-emerald-500" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-slate-100">All Reminders Sent!</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
              {sentCount} of {total} reminders processed.
            </p>
          </div>
          <button onClick={handleClose} className="btn-primary w-full">Done</button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm text-gray-500 dark:text-slate-400">
              <span>Reminder Progress</span>
              <span className="font-semibold">{sentCount}/{total}</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${(sentCount / total) * 100}%` }}
              />
            </div>
          </div>

          {/* Send All in 1-Click Button */}
          <button
            onClick={handleOpenAllAtOnce}
            className="btn-whatsapp w-full py-3 text-sm font-bold flex items-center justify-center gap-2 shadow-sm"
          >
            <MessageCircle className="w-4 h-4" />
            ⚡ Open WhatsApp for All {total} Students at Once
          </button>

          {/* Student list */}
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {queue.map((item, i) => (
              <div
                key={item.student.id}
                className={`flex items-center gap-3 p-2.5 rounded-xl text-sm transition-colors ${
                  i === currentIndex
                    ? 'bg-brand-50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800'
                    : 'bg-gray-50 dark:bg-slate-800'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                  item.sent
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
                    : i === currentIndex
                    ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-600'
                    : 'bg-gray-200 dark:bg-slate-700 text-gray-500'
                }`}>
                  {item.sent ? '✓' : i + 1}
                </div>
                <span className={`flex-1 font-medium ${
                  item.sent ? 'text-gray-400 dark:text-slate-500 line-through' : 'text-gray-800 dark:text-slate-200'
                }`}>
                  {item.student.student_name}
                </span>
                {item.sent && <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
              </div>
            ))}
          </div>

          {/* Current student details */}
          {current && !current.sent && (
            <div className="border-t border-gray-100 dark:border-slate-800 pt-4 space-y-4">
              <div>
                <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">
                  Step {currentIndex + 1} of {total}
                </p>
                <h3 className="font-semibold text-gray-900 dark:text-slate-100 text-base">
                  {current.student.student_name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  Parent: {current.student.parent_name} · {displayPhone(current.student.parent_phone)}
                </p>
                <div className="flex gap-2 mt-2">
                  <span className="badge-pending">
                    {formatCurrency(current.student.monthly_fee)}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-slate-500 self-center">
                    {formatMonth(month, year)}
                  </span>
                </div>
              </div>

              {/* Message preview */}
              <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-3">
                <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">Message Preview</p>
                <pre className="text-xs text-gray-700 dark:text-slate-300 whitespace-pre-wrap font-sans leading-relaxed line-clamp-5">
                  {current.message}
                </pre>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSkipThis}
                  className="btn-secondary px-4 text-xs font-semibold"
                >
                  Skip
                </button>
                <button
                  onClick={handleOpenAndMarkSent}
                  className="btn-whatsapp flex-1 btn-lg flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  Send WhatsApp ({currentIndex + 1}/{total})
                </button>
              </div>

              {confirmStep === 'loading' && (
                <div className="flex items-center justify-center gap-2 py-3 text-sm text-gray-500">
                  <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                  Saving...
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
