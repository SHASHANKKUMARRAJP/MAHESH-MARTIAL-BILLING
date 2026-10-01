import React, { useState, useMemo } from 'react'
import { BarChart2, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import { useStudents } from '../../hooks/useStudents'
import { usePayments } from '../../hooks/usePayments'
import { useReminders } from '../../hooks/useReminders'
import { LoadingState } from '../../components/ui/LoadingState'
import {
  formatMonth, formatCurrency, calculateCollectionRate, getCurrentMonth,
  MONTH_NAMES,
} from '../../lib/utils'

export function ReportsPage() {
  const now = getCurrentMonth()
  const [month, setMonth] = useState(now.month)
  const [year, setYear] = useState(now.year)

  const { students, loading: studentsLoading } = useStudents()
  const { payments, loading: paymentsLoading } = usePayments(month, year)
  const { reminders, loading: remindersLoading } = useReminders(month, year)

  const navigateMonth = (dir: 1 | -1) => {
    let m = month + dir, y = year
    if (m > 12) { m = 1; y++ }
    if (m < 1) { m = 12; y-- }
    setMonth(m); setYear(y)
  }

  const activeStudents = useMemo(() => students.filter(s => s.status === 'active'), [students])

  const report = useMemo(() => {
    const activeStudentIds = new Set(activeStudents.map(s => s.id))
    const validPayments = payments.filter(p => activeStudentIds.has(p.student_id))
    const validReminders = reminders.filter(r => activeStudentIds.has(r.student_id))

    const totalStudents = activeStudents.length
    const expectedFees = activeStudents.reduce((s, st) => s + st.monthly_fee, 0)

    const paidStudentIds = new Set(
      validPayments.filter(p => p.status === 'paid').map(p => p.student_id)
    )

    const paidStudents = paidStudentIds.size
    const pendingStudentsList = activeStudents.filter(s => !paidStudentIds.has(s.id))
    const pendingStudents = pendingStudentsList.length

    const collected = activeStudents
      .filter(s => paidStudentIds.has(s.id))
      .reduce((s, st) => s + st.monthly_fee, 0)

    const pending = pendingStudentsList.reduce((s, st) => s + st.monthly_fee, 0)

    const remindersSent = validReminders.filter(r => r.status === 'sent').length
    const remindersNotSent = Math.max(0, pendingStudents - remindersSent)
    const rate = calculateCollectionRate(collected, expectedFees)

    return {
      totalStudents, expectedFees, collected, pending,
      paidStudents, pendingStudents, remindersSent, remindersNotSent, rate,
    }
  }, [activeStudents, payments, reminders])

  const handleExportCSV = () => {
    const rows = [
      ['Student', 'Parent', 'Fee', 'Status', 'Payment Date', 'Method', 'Reminder'],
      ...activeStudents.map(s => {
        const p = payments.find(p => p.student_id === s.id)
        const r = reminders.find(r => r.student_id === s.id)
        return [
          s.student_name,
          s.parent_name,
          s.monthly_fee,
          p?.status ?? 'pending',
          p?.payment_date ?? '',
          p?.payment_method ?? '',
          r?.status ?? 'not sent',
        ]
      }),
    ]

    const csv = rows.map(row => row.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fees-report-${MONTH_NAMES[month - 1]}-${year}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const loading = studentsLoading || paymentsLoading || remindersLoading

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-base font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-brand-600" />
            Reports
          </h1>
          <button onClick={handleExportCSV} className="btn-secondary btn-sm">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Month navigation */}
        <div className="flex items-center justify-between card px-4 py-2.5">
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
      </div>

      <div className="page-content space-y-4">
        {loading ? <LoadingState message="Generating report..." /> : (
          <>
            {/* Collection Rate */}
            <div className="card p-5">
              <h2 className="font-semibold text-gray-900 dark:text-slate-100 mb-4">
                Collection Overview · {formatMonth(month, year)}
              </h2>

              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500 dark:text-slate-400">Collection Rate</span>
                <span className="text-lg font-bold text-gray-900 dark:text-slate-100">{report.rate}%</span>
              </div>
              <div className="progress-bar mb-4">
                <div className="progress-fill" style={{ width: `${report.rate}%` }} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-400 dark:text-slate-500">Total Students</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-slate-100">{report.totalStudents}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 dark:text-slate-500">Expected Fees</p>
                    <p className="text-lg font-bold text-gray-700 dark:text-slate-300">{formatCurrency(report.expectedFees)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 dark:text-slate-500">Collected</p>
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(report.collected)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 dark:text-slate-500">Pending</p>
                    <p className="text-lg font-bold text-red-500 dark:text-red-400">{formatCurrency(report.pending)}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-400 dark:text-slate-500">Paid Students</p>
                    <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{report.paidStudents}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 dark:text-slate-500">Pending Students</p>
                    <p className="text-xl font-bold text-red-500 dark:text-red-400">{report.pendingStudents}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 dark:text-slate-500">Reminders Sent</p>
                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{report.remindersSent}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 dark:text-slate-500">Reminders Pending</p>
                    <p className="text-xl font-bold text-gray-600 dark:text-slate-400">{report.remindersNotSent}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Student Breakdown */}
            <div className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800">
                <h3 className="font-semibold text-sm text-gray-800 dark:text-slate-200">Student Breakdown</h3>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-slate-800">
                {activeStudents.map(student => {
                  const payment = payments.find(p => p.student_id === student.id)
                  const reminder = reminders.find(r => r.student_id === student.id)
                  const isPaid = payment?.status === 'paid'

                  return (
                    <div key={student.id} className="flex items-center gap-3 px-4 py-3">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isPaid ? 'bg-emerald-500' : 'bg-red-400'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-slate-200 truncate">{student.student_name}</p>
                        <p className="text-xs text-gray-400 dark:text-slate-500">{student.batch || '—'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-800 dark:text-slate-200">{formatCurrency(student.monthly_fee)}</p>
                        <span className={`text-xs font-medium flex items-center justify-end gap-1 ${isPaid ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                          {isPaid ? (
                            <>
                              ✓ Paid {payment?.payment_method ? `(${payment.payment_method === 'bank_transfer' ? 'Bank' : payment.payment_method.toUpperCase()})` : ''}
                            </>
                          ) : '● Pending'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
