import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, CreditCard, Bell, TrendingUp, Plus, ArrowRight,
  MessageCircle, CheckCircle, AlertCircle,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useStudents } from '../../hooks/useStudents'
import { usePayments } from '../../hooks/usePayments'
import { useReminders } from '../../hooks/useReminders'
import { useSettings } from '../../hooks/useSettings'
import { useToast } from '../../contexts/ToastContext'
import { StatsCard } from '../../components/ui/StatsCard'
import { PaymentModal } from '../../components/ui/PaymentModal'
import { ReminderModal, type ReminderQueueItem } from '../../components/ui/ReminderModal'
import { FeeStatusBadge, ReminderStatusBadge } from '../../components/ui/StatusBadges'
import { LoadingState } from '../../components/ui/LoadingState'
import { EmptyState } from '../../components/ui/EmptyState'
import { Modal } from '../../components/ui/Modal'
import { StudentForm } from '../../components/students/StudentForm'
import {
  getGreeting, formatMonth, formatCurrency, getCurrentMonth,
  buildWhatsAppMessage, generateId,
} from '../../lib/utils'
import type { Student, PaymentFormData } from '../../types'

export function DashboardPage() {
  const { academy, profile } = useAuth()
  const { month, year } = getCurrentMonth()
  const { students, loading: studentsLoading, addStudent } = useStudents()
  const { payments, loading: paymentsLoading, fetchPayments, markPaid } = usePayments(month, year)
  const { reminders, initiateReminder, confirmReminderSent, fetchReminders } = useReminders(month, year)
  const { settings, whatsappTemplate } = useSettings()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [paymentModal, setPaymentModal] = useState<{ student: Student } | null>(null)
  const [reminderModal, setReminderModal] = useState(false)
  const [reminderQueue, setReminderQueue] = useState<ReminderQueueItem[]>([])
  const [addStudentOpen, setAddStudentOpen] = useState(false)
  const [addLoading, setAddLoading] = useState(false)

  const activeStudents = useMemo(() => students.filter(s => s.status === 'active'), [students])

  const pendingStudents = useMemo(() => {
    return activeStudents.filter(s => {
      const payment = payments.find(p => p.student_id === s.id)
      return !payment || payment.status === 'pending'
    })
  }, [activeStudents, payments])

  const stats = useMemo(() => {
    const activeStudentIds = new Set(activeStudents.map(s => s.id))
    const validPayments = payments.filter(p => activeStudentIds.has(p.student_id))

    const paidStudentIds = new Set(
      validPayments.filter(p => p.status === 'paid').map(p => p.student_id)
    )

    const collected = activeStudents
      .filter(s => paidStudentIds.has(s.id))
      .reduce((sum, s) => sum + s.monthly_fee, 0)

    const pending = pendingStudents.reduce((sum, s) => sum + s.monthly_fee, 0)

    const validReminders = reminders.filter(r => activeStudentIds.has(r.student_id))
    const remindersSent = validReminders.filter(r => r.status === 'sent').length

    return { collected, pending, remindersSent }
  }, [activeStudents, payments, pendingStudents, reminders])

  const handleMarkPaid = (student: Student) => {
    setPaymentModal({ student })
  }

  const handlePaymentConfirm = async (formData: PaymentFormData) => {
    if (!paymentModal) return
    const { error } = await markPaid(paymentModal.student.id, paymentModal.student.monthly_fee, formData)
    if (error) {
      showToast('error', 'Failed to record payment. Please try again.')
    } else {
      showToast('success', `Payment recorded for ${paymentModal.student.student_name} ✅`)
      setPaymentModal(null)
    }
  }

  const handleSendReminders = async (students: Student[]) => {
    const queue: ReminderQueueItem[] = []
    for (const student of students) {
      const message = buildWhatsAppMessage(whatsappTemplate, student, month, year)
      const { reminderId } = await initiateReminder(student.id, student.monthly_fee, message)
      queue.push({ student, reminderId, message, sent: false })
    }
    setReminderQueue(queue)
    setReminderModal(true)
  }

  const handleSingleReminder = (student: Student) => {
    handleSendReminders([student])
  }

  const handleMarkSent = async (index: number) => {
    const item = reminderQueue[index]
    if (!item.reminderId) return
    await confirmReminderSent(item.reminderId)
    setReminderQueue(prev => prev.map((q, i) => i === index ? { ...q, sent: true } : q))
    showToast('success', `Reminder marked as sent for ${item.student.student_name}`)
  }

  const handleCancelReminder = (index: number) => {
    setReminderQueue(prev => prev.map((q, i) => i === index ? { ...q, sent: false } : q))
  }

  const handleAddStudent = async (data: Parameters<typeof addStudent>[0]) => {
    setAddLoading(true)
    const { error } = await addStudent(data)
    setAddLoading(false)
    if (error) {
      showToast('error', 'Failed to add student. Please try again.')
    } else {
      showToast('success', 'Student added successfully!')
      setAddStudentOpen(false)
    }
  }

  if (studentsLoading || paymentsLoading) return <LoadingState message="Loading dashboard..." />

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-gray-900 dark:text-slate-100">
              {getGreeting()}, {profile?.name?.split(' ')[0] ?? 'Sensei'} 👋
            </h1>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              {formatMonth(month, year)} · {academy?.name}
            </p>
          </div>
          <button onClick={() => setAddStudentOpen(true)} className="btn-primary btn-sm">
            <Plus className="w-4 h-4" />
            Add Student
          </button>
        </div>
      </div>

      <div className="page-content space-y-5">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => setAddStudentOpen(true)}
            className="card p-3 flex flex-col items-center gap-2 text-center hover:shadow-card-hover transition-all active:scale-[0.97]"
          >
            <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/30 flex items-center justify-center text-brand-600 dark:text-brand-400">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">Add Student</span>
          </button>
          <button
            onClick={() => navigate('/reminders')}
            className="card p-3 flex flex-col items-center gap-2 text-center hover:shadow-card-hover transition-all active:scale-[0.97]"
          >
            <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-950/30 flex items-center justify-center text-green-600 dark:text-green-400">
              <Bell className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">Send Reminders</span>
          </button>
          <button
            onClick={() => navigate('/fees')}
            className="card p-3 flex flex-col items-center gap-2 text-center hover:shadow-card-hover transition-all active:scale-[0.97]"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">Record Payment</span>
          </button>
          <button
            onClick={() => navigate('/fees')}
            className="card p-3 flex flex-col items-center gap-2 text-center hover:shadow-card-hover transition-all active:scale-[0.97]"
          >
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-red-500 dark:text-red-400">
              <AlertCircle className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">Pending Fees</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatsCard
            label="Total Students"
            value={activeStudents.length}
            icon={<Users className="w-5 h-5" />}
          />
          <StatsCard
            label="Collected"
            value={formatCurrency(stats.collected)}
            icon={<TrendingUp className="w-5 h-5" />}
          />
          <StatsCard
            label="Pending"
            value={formatCurrency(stats.pending)}
            icon={<CreditCard className="w-5 h-5" />}
          />
          <StatsCard
            label="Reminders Sent"
            value={stats.remindersSent}
            icon={<Bell className="w-5 h-5" />}
          />
        </div>

        {/* Pending Fees */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              Pending Fees
              <span className="text-xs font-normal text-gray-400 dark:text-slate-500">
                ({pendingStudents.length})
              </span>
            </h2>
            {pendingStudents.length > 0 && (
              <button
                onClick={() => handleSendReminders(pendingStudents.slice(0, 10))}
                className="btn-whatsapp btn-sm"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Send All
              </button>
            )}
          </div>

          {pendingStudents.length === 0 ? (
            <EmptyState
              icon={<CheckCircle className="w-8 h-8" />}
              title="All fees are collected 🎉"
              description={`All active students have paid for ${formatMonth(month, year)}.`}
            />
          ) : (
            <div className="card divide-y divide-gray-50 dark:divide-slate-800">
              {pendingStudents.slice(0, 8).map(student => {
                const reminder = reminders.find(r => r.student_id === student.id)
                return (
                  <div key={student.id} className="flex items-center gap-3 p-4">
                    <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-950/40 flex items-center justify-center text-brand-700 dark:text-brand-300 font-bold text-xs flex-shrink-0">
                      {student.student_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 dark:text-slate-100 truncate">
                        {student.student_name}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-slate-500 truncate">
                        {student.parent_name}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs font-bold text-gray-700 dark:text-slate-300">
                          {formatCurrency(student.monthly_fee)}
                        </span>
                        <ReminderStatusBadge status={reminder?.status} />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => handleSingleReminder(student)}
                        className="btn-whatsapp btn-sm"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        Remind
                      </button>
                      <button
                        onClick={() => handleMarkPaid(student)}
                        className="btn-secondary btn-sm"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Paid
                      </button>
                    </div>
                  </div>
                )
              })}
              {pendingStudents.length > 8 && (
                <button
                  onClick={() => navigate('/fees')}
                  className="flex items-center justify-center gap-2 p-4 text-sm text-brand-600 dark:text-brand-400 font-medium w-full hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                >
                  View all {pendingStudents.length} pending students
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <PaymentModal
        isOpen={!!paymentModal}
        onClose={() => setPaymentModal(null)}
        studentName={paymentModal?.student.student_name ?? ''}
        month={month}
        year={year}
        amount={paymentModal?.student.monthly_fee ?? 0}
        onConfirm={handlePaymentConfirm}
      />

      <ReminderModal
        isOpen={reminderModal}
        onClose={() => { setReminderModal(false); fetchReminders() }}
        queue={reminderQueue}
        month={month}
        year={year}
        onMarkSent={handleMarkSent}
        onCancel={handleCancelReminder}
      />

      <Modal isOpen={addStudentOpen} onClose={() => setAddStudentOpen(false)} title="Add Student">
        <StudentForm
          defaultFee={settings?.default_fee}
          onSubmit={handleAddStudent}
          onCancel={() => setAddStudentOpen(false)}
          loading={addLoading}
        />
      </Modal>
    </div>
  )
}
