import React, { useState, useMemo } from 'react'
import { CreditCard, ChevronLeft, ChevronRight, CheckCircle, RotateCcw } from 'lucide-react'
import { useStudents } from '../../hooks/useStudents'
import { usePayments } from '../../hooks/usePayments'
import { useReminders } from '../../hooks/useReminders'
import { useSettings } from '../../hooks/useSettings'
import { useToast } from '../../contexts/ToastContext'
import { PaymentModal } from '../../components/ui/PaymentModal'
import { ReminderModal, type ReminderQueueItem } from '../../components/ui/ReminderModal'
import { FeeStatusBadge, ReminderStatusBadge } from '../../components/ui/StatusBadges'
import { SearchBar, FilterBar } from '../../components/ui/SearchFilter'
import { LoadingState } from '../../components/ui/LoadingState'
import { EmptyState } from '../../components/ui/EmptyState'
import {
  formatMonth, formatDate, formatCurrency, calculateCollectionRate,
  buildWhatsAppMessage, getCurrentMonth,
} from '../../lib/utils'
import type { Student, PaymentFormData } from '../../types'

export function FeesPage() {
  const now = getCurrentMonth()
  const [month, setMonth] = useState(now.month)
  const [year, setYear] = useState(now.year)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending'>('all')
  const [paymentModal, setPaymentModal] = useState<Student | null>(null)
  const [reminderModal, setReminderModal] = useState(false)
  const [reminderQueue, setReminderQueue] = useState<ReminderQueueItem[]>([])

  const { students, loading: studentsLoading } = useStudents()
  const { payments, loading: paymentsLoading, markPaid, markPending, fetchPayments } = usePayments(month, year)
  const { reminders, initiateReminder, confirmReminderSent, resetReminder, fetchReminders } = useReminders(month, year)
  const { whatsappTemplate } = useSettings()
  const { showToast } = useToast()

  const navigateMonth = (dir: 1 | -1) => {
    let m = month + dir, y = year
    if (m > 12) { m = 1; y++ }
    if (m < 1) { m = 12; y-- }
    setMonth(m); setYear(y)
  }

  const activeStudents = useMemo(() => students.filter(s => s.status === 'active'), [students])

  const tableData = useMemo(() => {
    let list = activeStudents.map(student => {
      const payment = payments.find(p => p.student_id === student.id)
      const reminder = reminders.find(r => r.student_id === student.id)
      return { student, payment, reminder }
    })

    if (search) {
      const q = search.toLowerCase()
      list = list.filter(({ student: s }) =>
        s.student_name.toLowerCase().includes(q) || s.parent_name.toLowerCase().includes(q)
      )
    }
    if (filter === 'paid') list = list.filter(({ payment: p }) => p?.status === 'paid')
    if (filter === 'pending') list = list.filter(({ payment: p }) => !p || p.status === 'pending')

    return list
  }, [activeStudents, payments, reminders, search, filter])

  const stats = useMemo(() => {
    const activeStudentIds = new Set(activeStudents.map(s => s.id))
    const validPayments = payments.filter(p => activeStudentIds.has(p.student_id))

    const expected = activeStudents.reduce((s, st) => s + st.monthly_fee, 0)

    const paidStudentIds = new Set(
      validPayments.filter(p => p.status === 'paid').map(p => p.student_id)
    )

    const paidCount = paidStudentIds.size
    const pendingStudentsList = activeStudents.filter(s => !paidStudentIds.has(s.id))
    const pendingCount = pendingStudentsList.length

    const collected = activeStudents
      .filter(s => paidStudentIds.has(s.id))
      .reduce((s, st) => s + st.monthly_fee, 0)

    const pending = pendingStudentsList.reduce((s, st) => s + st.monthly_fee, 0)
    const rate = calculateCollectionRate(collected, expected)

    return { expected, collected, pending, rate, paidCount, pendingCount }
  }, [activeStudents, payments])

  const handleMarkPaid = async (formData: PaymentFormData) => {
    if (!paymentModal) return
    const { error } = await markPaid(paymentModal.id, paymentModal.monthly_fee, formData)
    if (error) showToast('error', 'Failed to record payment.')
    else { showToast('success', `Payment recorded ✅`); setPaymentModal(null) }
  }

  const handleMarkPending = async (student: Student) => {
    const { error } = await markPending(student.id)
    if (error) showToast('error', 'Failed to revert payment.')
    else showToast('success', `Payment reverted to Pending for ${student.student_name} ↩️`)
  }

  const handleResetReminder = async (student: Student) => {
    const { error } = await resetReminder(student.id)
    if (error) showToast('error', 'Failed to reset reminder.')
    else showToast('success', `Reminder reset to Not Sent for ${student.student_name}`)
  }

  const handleSendReminder = async (student: Student) => {
    const message = buildWhatsAppMessage(whatsappTemplate, student, month, year)
    const { reminderId } = await initiateReminder(student.id, student.monthly_fee, message)
    setReminderQueue([{ student, reminderId, message, sent: false, amount: student.monthly_fee }])
    setReminderModal(true)
  }

  const filterOptions = [
    { label: 'All', value: 'all' },
    { label: 'Paid', value: 'paid', count: stats.paidCount },
    { label: 'Pending', value: 'pending', count: stats.pendingCount },
  ]

  const loading = studentsLoading || paymentsLoading

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-base font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-brand-600" />
            Fees
          </h1>
        </div>

        {/* Month navigation */}
        <div className="flex items-center justify-between card px-4 py-2.5 mb-3">
          <button onClick={() => navigateMonth(-1)} className="btn-icon btn-ghost w-8 h-8">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-semibold text-sm text-gray-800 dark:text-slate-200">
            {formatMonth(month, year)}
          </span>
          <button onClick={() => navigateMonth(1)} className="btn-icon btn-ghost w-8 h-8">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <SearchBar value={search} onChange={setSearch} placeholder="Search student..." />
        <div className="mt-2">
          <FilterBar filters={filterOptions} active={filter} onChange={v => setFilter(v as 'all' | 'paid' | 'pending')} />
        </div>
      </div>

      <div className="page-content space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card p-4">
            <p className="text-xs text-gray-400 dark:text-slate-500">Expected</p>
            <p className="text-xl font-bold text-gray-900 dark:text-slate-100 mt-0.5">{formatCurrency(stats.expected)}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-gray-400 dark:text-slate-500">Collected</p>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{formatCurrency(stats.collected)}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-gray-400 dark:text-slate-500">Pending</p>
            <p className="text-xl font-bold text-red-500 dark:text-red-400 mt-0.5">{formatCurrency(stats.pending)}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-gray-400 dark:text-slate-500">Collection Rate</p>
            <div className="flex items-end gap-2 mt-0.5">
              <p className="text-xl font-bold text-gray-900 dark:text-slate-100">{stats.rate}%</p>
            </div>
            <div className="progress-bar mt-1.5">
              <div className="progress-fill" style={{ width: `${stats.rate}%` }} />
            </div>
          </div>
        </div>

        {loading ? (
          <LoadingState message="Loading fees..." />
        ) : tableData.length === 0 ? (
          <EmptyState
            icon={<CreditCard className="w-8 h-8" />}
            title="No results"
            description="Try a different search or filter."
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-semibold text-gray-400 dark:text-slate-500 border-b border-gray-100 dark:border-slate-800">
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Payment Date</th>
                    <th className="px-4 py-3">Reminder</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                  {tableData.map(({ student, payment, reminder }) => {
                    const isPaid = payment?.status === 'paid'
                    const isSent = reminder?.status === 'sent'

                    return (
                      <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-sm text-gray-900 dark:text-slate-100">{student.student_name}</p>
                          <p className="text-xs text-gray-400 dark:text-slate-500">{student.parent_name}</p>
                        </td>
                        <td className="px-4 py-3 font-semibold text-sm">{formatCurrency(student.monthly_fee)}</td>
                        <td className="px-4 py-3">
                          <FeeStatusBadge
                            status={isPaid ? 'paid' : 'pending'}
                            onClick={() => isPaid ? handleMarkPending(student) : setPaymentModal(student)}
                            title={isPaid ? 'Click to Undo Paid status' : 'Click to mark as Paid'}
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-slate-400">
                          {payment?.payment_date ? formatDate(payment.payment_date) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <ReminderStatusBadge
                            status={reminder?.status}
                            onClick={() => isSent ? handleResetReminder(student) : handleSendReminder(student)}
                            title={isSent ? 'Click to reset reminder status to Not Sent' : 'Click to send reminder'}
                          />
                        </td>
                        <td className="px-4 py-3">
                          {!isPaid ? (
                            <div className="flex gap-2">
                              <button onClick={() => handleSendReminder(student)} className="btn-whatsapp btn-sm">Remind</button>
                              <button onClick={() => setPaymentModal(student)} className="btn-primary btn-sm">Mark Paid</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleMarkPending(student)}
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
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden card divide-y divide-gray-50 dark:divide-slate-800">
              {tableData.map(({ student, payment, reminder }) => {
                const isPaid = payment?.status === 'paid'
                const isSent = reminder?.status === 'sent'

                return (
                  <div key={student.id} className="p-4 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-950/40 flex items-center justify-center text-brand-700 dark:text-brand-300 font-bold text-xs flex-shrink-0">
                      {student.student_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 dark:text-slate-100">{student.student_name}</p>
                      <p className="text-xs text-gray-400 dark:text-slate-500 mb-2">{student.parent_name}</p>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className="text-sm font-bold text-gray-800 dark:text-slate-200">{formatCurrency(student.monthly_fee)}</span>
                        <FeeStatusBadge
                          status={isPaid ? 'paid' : 'pending'}
                          onClick={() => isPaid ? handleMarkPending(student) : setPaymentModal(student)}
                        />
                        <ReminderStatusBadge
                          status={reminder?.status}
                          onClick={() => isSent ? handleResetReminder(student) : handleSendReminder(student)}
                        />
                      </div>
                      {payment?.payment_date && isPaid && (
                        <p className="text-xs text-gray-400 dark:text-slate-500 mb-2">Paid: {formatDate(payment.payment_date)}</p>
                      )}
                      {!isPaid ? (
                        <div className="flex gap-2">
                          <button onClick={() => handleSendReminder(student)} className="btn-whatsapp btn-sm flex-1">Remind</button>
                          <button onClick={() => setPaymentModal(student)} className="btn-primary btn-sm flex-1">Mark Paid</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleMarkPending(student)}
                          className="w-full py-1 px-3 rounded-lg text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors flex items-center justify-center gap-1 mt-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Undo Paid (Mark Pending)
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      <PaymentModal
        isOpen={!!paymentModal}
        onClose={() => setPaymentModal(null)}
        studentName={paymentModal?.student_name ?? ''}
        month={month}
        year={year}
        amount={paymentModal?.monthly_fee ?? 0}
        onConfirm={handleMarkPaid}
      />

      <ReminderModal
        isOpen={reminderModal}
        onClose={() => { setReminderModal(false); fetchReminders() }}
        queue={reminderQueue}
        month={month}
        year={year}
        onMarkSent={async (i) => {
          const item = reminderQueue[i]
          if (item.reminderId) {
            await confirmReminderSent(item.reminderId)
            setReminderQueue(prev => prev.map((q, idx) => idx === i ? { ...q, sent: true } : q))
          }
        }}
        onCancel={(i) => setReminderQueue(prev => prev.map((q, idx) => idx === i ? { ...q, sent: false } : q))}
      />
    </div>
  )
}
