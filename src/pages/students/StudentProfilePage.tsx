import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, MessageCircle, CheckCircle, Phone, Calendar,
  DollarSign, Users, Clock, Pencil, RotateCcw,
} from 'lucide-react'
import { useStudents } from '../../hooks/useStudents'
import { usePayments } from '../../hooks/usePayments'
import { useReminders } from '../../hooks/useReminders'
import { useSettings } from '../../hooks/useSettings'
import { useToast } from '../../contexts/ToastContext'
import { PaymentModal } from '../../components/ui/PaymentModal'
import { ReminderModal, type ReminderQueueItem } from '../../components/ui/ReminderModal'
import { Modal } from '../../components/ui/Modal'
import { StudentForm } from '../../components/students/StudentForm'
import { FeeStatusBadge, ReminderStatusBadge, StudentStatusBadge } from '../../components/ui/StatusBadges'
import { LoadingState } from '../../components/ui/LoadingState'
import {
  formatMonth, formatDate, formatDateTime, formatCurrency, displayPhone,
  getInitials, getCurrentMonth, buildWhatsAppMessage, buildWhatsAppLink,
} from '../../lib/utils'
import type { Payment, Reminder, PaymentFormData } from '../../types'

export function StudentProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { students, updateStudent, loading: studentsLoading } = useStudents()
  const { month, year } = getCurrentMonth()
  const { payments: currentPayments, markPaid, markPending, getStudentPaymentHistory } = usePayments(month, year)
  const { reminders: currentReminders, initiateReminder, confirmReminderSent, resetReminder, getStudentReminderHistory } = useReminders(month, year)
  const { settings, whatsappTemplate } = useSettings()
  const { showToast } = useToast()

  const student = students.find(s => s.id === id)
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([])
  const [reminderHistory, setReminderHistory] = useState<Reminder[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [paymentModal, setPaymentModal] = useState(false)
  const [reminderModal, setReminderModal] = useState(false)
  const [reminderQueue, setReminderQueue] = useState<ReminderQueueItem[]>([])
  const [editOpen, setEditOpen] = useState(false)
  const [editLoading, setEditLoading] = useState(false)

  const currentPayment = currentPayments.find(p => p.student_id === id)
  const currentReminder = currentReminders.find(r => r.student_id === id)

  useEffect(() => {
    if (!id) return
    const load = async () => {
      setHistoryLoading(true)
      const [ph, rh] = await Promise.all([
        getStudentPaymentHistory(id),
        getStudentReminderHistory(id),
      ])
      setPaymentHistory(ph)
      setReminderHistory(rh)
      setHistoryLoading(false)
    }
    load()
  }, [id, getStudentPaymentHistory, getStudentReminderHistory, currentPayments, currentReminders])

  if (studentsLoading) return <LoadingState fullPage />
  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-gray-500">Student not found</p>
        <button onClick={() => navigate('/students')} className="btn-primary">Go Back</button>
      </div>
    )
  }

  const handleMarkPaid = async (formData: PaymentFormData) => {
    const { error } = await markPaid(student.id, student.monthly_fee, formData)
    if (error) showToast('error', 'Failed to record payment.')
    else {
      showToast('success', 'Payment recorded ✅')
      setPaymentModal(false)
      const ph = await getStudentPaymentHistory(student.id)
      setPaymentHistory(ph)
    }
  }

  const handleMarkPending = async () => {
    const { error } = await markPending(student.id)
    if (error) showToast('error', 'Failed to revert payment.')
    else {
      showToast('success', 'Payment status reverted to Pending ↩️')
      const ph = await getStudentPaymentHistory(student.id)
      setPaymentHistory(ph)
    }
  }

  const handleResetReminder = async () => {
    const { error } = await resetReminder(student.id)
    if (error) showToast('error', 'Failed to reset reminder.')
    else {
      showToast('success', 'Reminder status reset to Not Sent')
      const rh = await getStudentReminderHistory(student.id)
      setReminderHistory(rh)
    }
  }

  const handleSendReminder = async () => {
    const message = buildWhatsAppMessage(whatsappTemplate, student, month, year)
    const { reminderId } = await initiateReminder(student.id, student.monthly_fee, message)
    setReminderQueue([{ student, reminderId, message, sent: false }])
    setReminderModal(true)
  }

  const handleMarkSent = async (index: number) => {
    const item = reminderQueue[index]
    if (!item.reminderId) return
    await confirmReminderSent(item.reminderId)
    setReminderQueue(prev => prev.map((q, i) => i === index ? { ...q, sent: true } : q))
    showToast('success', 'Reminder marked as sent')
    const rh = await getStudentReminderHistory(student.id)
    setReminderHistory(rh)
  }

  const handleEdit = async (data: Parameters<typeof updateStudent>[1]) => {
    setEditLoading(true)
    const { error } = await updateStudent(student.id, data)
    setEditLoading(false)
    if (error) showToast('error', 'Failed to update.')
    else { showToast('success', 'Updated!'); setEditOpen(false) }
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-icon btn-ghost">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-bold text-gray-900 dark:text-slate-100">Student Profile</h1>
          <button onClick={() => setEditOpen(true)} className="btn-icon btn-ghost ml-auto">
            <Pencil className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="page-content space-y-5">
        {/* Profile Card */}
        <div className="card p-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-100 dark:bg-brand-950/40 flex items-center justify-center text-brand-700 dark:text-brand-300 font-bold text-xl flex-shrink-0">
              {getInitials(student.student_name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">{student.student_name}</h2>
                <StudentStatusBadge status={student.status} />
              </div>
              {student.batch && (
                <p className="text-sm text-gray-500 dark:text-slate-400">{student.batch}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-5 pt-4 border-t border-gray-50 dark:border-slate-800">
            <div>
              <p className="text-xs text-gray-400 dark:text-slate-500 mb-0.5">Parent</p>
              <p className="text-sm font-semibold text-gray-800 dark:text-slate-200">{student.parent_name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 dark:text-slate-500 mb-0.5">WhatsApp</p>
              <a
                href={buildWhatsAppLink(student.parent_phone, '')}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-brand-600 dark:text-brand-400 flex items-center gap-1"
              >
                <Phone className="w-3.5 h-3.5" />
                {displayPhone(student.parent_phone)}
              </a>
            </div>
            <div>
              <p className="text-xs text-gray-400 dark:text-slate-500 mb-0.5">Monthly Fee</p>
              <p className="text-sm font-bold text-gray-800 dark:text-slate-200">{formatCurrency(student.monthly_fee)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 dark:text-slate-500 mb-0.5">Joined</p>
              <p className="text-sm font-medium text-gray-700 dark:text-slate-300">{formatDate(student.joining_date)}</p>
            </div>
          </div>

          {/* Primary Actions */}
          <div className="flex gap-3 mt-5">
            {currentPayment?.status !== 'paid' ? (
              <>
                <button onClick={handleSendReminder} className="btn-whatsapp flex-1">
                  <MessageCircle className="w-4 h-4" />
                  Send Reminder
                </button>
                <button onClick={() => setPaymentModal(true)} className="btn-primary flex-1">
                  <CheckCircle className="w-4 h-4" />
                  Mark Paid
                </button>
              </>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-semibold text-sm">
                  <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Fee paid for {formatMonth(month, year)}</span>
                </div>
                <button
                  onClick={handleMarkPending}
                  className="btn-secondary btn-sm text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/40 flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Undo Paid Status
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Current Month */}
        <div className="card p-5">
          <h3 className="section-title">Current Month</h3>
          <p className="font-semibold text-gray-900 dark:text-slate-100 mb-3">{formatMonth(month, year)}</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">Fee</p>
              <p className="text-base font-bold text-gray-800 dark:text-slate-200">{formatCurrency(student.monthly_fee)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">Status</p>
              <FeeStatusBadge status={currentPayment?.status ?? 'pending'} />
            </div>
            <div>
              <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">Reminder</p>
              <ReminderStatusBadge status={currentReminder?.status} />
            </div>
            {currentPayment?.payment_date && (
              <div>
                <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">Paid On</p>
                <p className="text-sm font-medium text-gray-700 dark:text-slate-300">{formatDate(currentPayment.payment_date)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Payment History */}
        <div className="card p-5">
          <h3 className="section-title">Payment History</h3>
          {historyLoading ? (
            <div className="flex items-center justify-center py-6">
              <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : paymentHistory.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-4">No payment records yet.</p>
          ) : (
            <div className="space-y-2">
              {paymentHistory.map(p => (
                <div key={p.id} className="flex items-center gap-3 py-2 border-b border-gray-50 dark:border-slate-800 last:border-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    p.status === 'paid' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'
                  }`}>
                    {p.status === 'paid'
                      ? <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      : <DollarSign className="w-4 h-4 text-red-500" />
                    }
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800 dark:text-slate-200">{formatMonth(p.month, p.year)}</p>
                    {p.payment_date && (
                      <p className="text-xs text-gray-400 dark:text-slate-500">{formatDate(p.payment_date)}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-800 dark:text-slate-200">{formatCurrency(p.amount)}</p>
                    <FeeStatusBadge status={p.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reminder History */}
        <div className="card p-5">
          <h3 className="section-title">Reminder History</h3>
          {historyLoading ? (
            <div className="flex items-center justify-center py-6">
              <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : reminderHistory.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-4">No reminders sent yet.</p>
          ) : (
            <div className="space-y-2">
              {reminderHistory.map(r => (
                <div key={r.id} className="flex items-center gap-3 py-2 border-b border-gray-50 dark:border-slate-800 last:border-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    r.status === 'sent' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-slate-800'
                  }`}>
                    <MessageCircle className={`w-4 h-4 ${r.status === 'sent' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800 dark:text-slate-200">{formatMonth(r.month, r.year)}</p>
                    {r.initiated_at && (
                      <p className="text-xs text-gray-400 dark:text-slate-500">{formatDateTime(r.initiated_at)}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-700 dark:text-slate-300">{formatCurrency(r.amount)}</p>
                    <ReminderStatusBadge status={r.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <PaymentModal
        isOpen={paymentModal}
        onClose={() => setPaymentModal(false)}
        studentName={student.student_name}
        month={month}
        year={year}
        amount={student.monthly_fee}
        onConfirm={handleMarkPaid}
      />

      <ReminderModal
        isOpen={reminderModal}
        onClose={() => setReminderModal(false)}
        queue={reminderQueue}
        month={month}
        year={year}
        onMarkSent={handleMarkSent}
        onCancel={() => {}}
      />

      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Student">
        <StudentForm
          initial={student}
          defaultFee={settings?.default_fee}
          onSubmit={handleEdit}
          onCancel={() => setEditOpen(false)}
          loading={editLoading}
        />
      </Modal>
    </div>
  )
}
