import React from 'react'
import { MessageCircle, CheckCircle, Phone, RotateCcw } from 'lucide-react'
import type { Student, Payment, Reminder } from '../../types'
import { FeeStatusBadge, ReminderStatusBadge, StudentStatusBadge } from '../ui/StatusBadges'
import { formatCurrency, displayPhone, getInitials, formatMonth } from '../../lib/utils'

interface StudentCardProps {
  student: Student
  payment?: Payment | null
  reminder?: Reminder | null
  month: number
  year: number
  onSendReminder: (student: Student) => void
  onMarkPaid: (student: Student) => void
  onMarkPending?: (student: Student) => void
  onResetReminder?: (student: Student) => void
  onViewProfile: (student: Student) => void
  selected?: boolean
  onSelect?: (student: Student) => void
  showCheckbox?: boolean
}

export function StudentCard({
  student, payment, reminder, month, year,
  onSendReminder, onMarkPaid, onMarkPending, onResetReminder, onViewProfile,
  selected, onSelect, showCheckbox,
}: StudentCardProps) {
  const paymentStatus = payment?.status ?? 'pending'
  const reminderStatus = reminder?.status

  return (
    <div
      className={`
        card p-4 transition-all duration-150
        ${selected ? 'ring-2 ring-brand-500 border-brand-200 dark:border-brand-800' : 'hover:shadow-card-hover'}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox (when in select mode) */}
        {showCheckbox && (
          <button
            onClick={() => onSelect?.(student)}
            className={`
              w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 border-2 transition-colors
              ${selected
                ? 'bg-brand-600 border-brand-600 text-white'
                : 'border-gray-300 dark:border-slate-600'}
            `}
          >
            {selected && (
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        )}

        {/* Avatar */}
        <button
          onClick={() => onViewProfile(student)}
          className="w-11 h-11 rounded-xl bg-brand-100 dark:bg-brand-950/40 flex items-center justify-center flex-shrink-0 text-brand-700 dark:text-brand-300 font-bold text-sm"
        >
          {getInitials(student.student_name)}
        </button>

        {/* Info */}
        <div className="flex-1 min-w-0" onClick={() => onViewProfile(student)}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 dark:text-slate-100 truncate">
              {student.student_name}
            </span>
            <StudentStatusBadge status={student.status} />
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
            {student.parent_name}
          </p>
          <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-400 dark:text-slate-500">
            <Phone className="w-3 h-3 flex-shrink-0" />
            <span>{displayPhone(student.parent_phone)}</span>
          </div>
        </div>
      </div>

      {/* Details row */}
      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-50 dark:border-slate-800">
        <div className="flex-1">
          <p className="text-xs text-gray-400 dark:text-slate-500">Fee</p>
          <p className="text-sm font-bold text-gray-800 dark:text-slate-200">{formatCurrency(student.monthly_fee)}</p>
        </div>
        {student.batch && (
          <div className="flex-1">
            <p className="text-xs text-gray-400 dark:text-slate-500">Batch</p>
            <p className="text-sm font-medium text-gray-700 dark:text-slate-300 truncate">{student.batch}</p>
          </div>
        )}
        <div className="flex-1">
          <p className="text-xs text-gray-400 dark:text-slate-500">{formatMonth(month, year)}</p>
          <FeeStatusBadge
            status={paymentStatus}
            onClick={paymentStatus === 'paid' ? () => onMarkPending?.(student) : () => onMarkPaid(student)}
            title={paymentStatus === 'paid' ? 'Click to Undo Paid status' : 'Click to mark as Paid'}
          />
        </div>
        <div className="flex-1">
          <p className="text-xs text-gray-400 dark:text-slate-500">Reminder</p>
          <ReminderStatusBadge
            status={reminderStatus}
            onClick={reminderStatus === 'sent' ? () => onResetReminder?.(student) : () => onSendReminder(student)}
            title={reminderStatus === 'sent' ? 'Click to reset reminder to Not Sent' : 'Click to send reminder'}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50 dark:border-slate-800">
        {paymentStatus === 'pending' ? (
          <>
            <button
              onClick={() => onSendReminder(student)}
              className="btn-whatsapp btn-sm flex-1"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Remind
            </button>
            <button
              onClick={() => onMarkPaid(student)}
              className="btn-secondary btn-sm flex-1"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Mark Paid
            </button>
          </>
        ) : (
          <button
            onClick={() => onMarkPending?.(student)}
            className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors flex items-center justify-center gap-1.5"
            title="Revert payment status back to Pending"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Undo Paid (Mark Pending)
          </button>
        )}
      </div>
    </div>
  )
}

interface StudentRowProps {
  student: Student
  payment?: Payment | null
  reminder?: Reminder | null
  month: number
  year: number
  onSendReminder: (student: Student) => void
  onMarkPaid: (student: Student) => void
  onMarkPending?: (student: Student) => void
  onResetReminder?: (student: Student) => void
  onViewProfile: (student: Student) => void
}

export function StudentRow({
  student, payment, reminder, month, year,
  onSendReminder, onMarkPaid, onMarkPending, onResetReminder, onViewProfile,
}: StudentRowProps) {
  const paymentStatus = payment?.status ?? 'pending'
  const reminderStatus = reminder?.status

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onViewProfile(student)}
            className="w-9 h-9 rounded-lg bg-brand-100 dark:bg-brand-950/40 flex items-center justify-center text-brand-700 dark:text-brand-300 font-bold text-xs flex-shrink-0"
          >
            {getInitials(student.student_name)}
          </button>
          <div>
            <button
              onClick={() => onViewProfile(student)}
              className="font-semibold text-gray-900 dark:text-slate-100 hover:text-brand-600 dark:hover:text-brand-400 text-sm"
            >
              {student.student_name}
            </button>
            <p className="text-xs text-gray-400 dark:text-slate-500">{student.parent_name}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600 dark:text-slate-300">{student.batch || '—'}</td>
      <td className="px-4 py-3 text-sm font-semibold text-gray-800 dark:text-slate-200">{formatCurrency(student.monthly_fee)}</td>
      <td className="px-4 py-3">
        <FeeStatusBadge
          status={paymentStatus}
          onClick={paymentStatus === 'paid' ? () => onMarkPending?.(student) : () => onMarkPaid(student)}
        />
      </td>
      <td className="px-4 py-3">
        <ReminderStatusBadge
          status={reminderStatus}
          onClick={reminderStatus === 'sent' ? () => onResetReminder?.(student) : () => onSendReminder(student)}
        />
      </td>
      <td className="px-4 py-3">
        {paymentStatus === 'pending' ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSendReminder(student)}
              className="btn-whatsapp btn-sm"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Remind
            </button>
            <button
              onClick={() => onMarkPaid(student)}
              className="btn-secondary btn-sm"
            >
              Paid
            </button>
          </div>
        ) : (
          <button
            onClick={() => onMarkPending?.(student)}
            className="btn-ghost btn-sm text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center gap-1 font-medium"
            title="Revert payment status back to Pending"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Undo Paid
          </button>
        )}
      </td>
    </tr>
  )
}
