import React from 'react'
import { CheckCircle, Clock } from 'lucide-react'
import type { PaymentStatus, ReminderStatus, StudentStatus } from '../../types'

interface FeeStatusBadgeProps {
  status: PaymentStatus
  showIcon?: boolean
  onClick?: () => void
  title?: string
}

export function FeeStatusBadge({ status, showIcon = true, onClick, title }: FeeStatusBadgeProps) {
  if (status === 'paid') {
    return (
      <span
        onClick={onClick}
        title={title ?? (onClick ? 'Click to mark as Pending' : undefined)}
        className={`badge-paid ${onClick ? 'cursor-pointer hover:opacity-80 active:scale-95 transition-all' : ''}`}
      >
        {showIcon && <CheckCircle className="w-3 h-3" />}
        Paid
      </span>
    )
  }
  return (
    <span
      onClick={onClick}
      title={title ?? (onClick ? 'Click to mark as Paid' : undefined)}
      className={`badge-pending ${onClick ? 'cursor-pointer hover:opacity-80 active:scale-95 transition-all' : ''}`}
    >
      {showIcon && <div className="w-2 h-2 rounded-full bg-red-500" />}
      Pending
    </span>
  )
}

interface ReminderStatusBadgeProps {
  status: ReminderStatus | undefined
  showIcon?: boolean
  onClick?: () => void
  title?: string
}

export function ReminderStatusBadge({ status, showIcon = true, onClick, title }: ReminderStatusBadgeProps) {
  if (status === 'sent') {
    return (
      <span
        onClick={onClick}
        title={title ?? (onClick ? 'Click to reset reminder to Not Sent' : undefined)}
        className={`badge-reminder-sent ${onClick ? 'cursor-pointer hover:opacity-80 active:scale-95 transition-all' : ''}`}
      >
        {showIcon && <CheckCircle className="w-3 h-3" />}
        Sent
      </span>
    )
  }
  return (
    <span
      onClick={onClick}
      title={title ?? (onClick ? 'Click to set reminder as Sent' : undefined)}
      className={`badge-reminder-none ${onClick ? 'cursor-pointer hover:opacity-80 active:scale-95 transition-all' : ''}`}
    >
      {showIcon && <Clock className="w-3 h-3" />}
      Not Sent
    </span>
  )
}

interface StudentStatusBadgeProps {
  status: StudentStatus
}

export function StudentStatusBadge({ status }: StudentStatusBadgeProps) {
  if (status === 'active') {
    return <span className="badge-active">Active</span>
  }
  return <span className="badge-inactive">Inactive</span>
}
