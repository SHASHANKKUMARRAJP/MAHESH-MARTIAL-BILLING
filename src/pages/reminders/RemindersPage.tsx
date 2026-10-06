import React, { useState, useMemo, useEffect } from 'react'
import { Bell, MessageCircle, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { useStudents } from '../../hooks/useStudents'
import { usePayments } from '../../hooks/usePayments'
import { useReminders } from '../../hooks/useReminders'
import { useSettings } from '../../hooks/useSettings'
import { useToast } from '../../contexts/ToastContext'
import { ReminderModal, type ReminderQueueItem } from '../../components/ui/ReminderModal'
import { Modal } from '../../components/ui/Modal'
import { FeeStatusBadge, ReminderStatusBadge } from '../../components/ui/StatusBadges'
import { EmptyState } from '../../components/ui/EmptyState'
import { LoadingState } from '../../components/ui/LoadingState'
import { formatMonth, formatCurrency, formatDateTime, buildWhatsAppMessage, getCurrentMonth } from '../../lib/utils'
import type { Student } from '../../types'

export function RemindersPage() {
  const now = getCurrentMonth()
  const [month, setMonth] = useState(now.month)
  const [year, setYear] = useState(now.year)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [reminderModal, setReminderModal] = useState(false)
  const [reminderQueue, setReminderQueue] = useState<ReminderQueueItem[]>([])
  const [configModal, setConfigModal] = useState(false)
  const [reminderType, setReminderType] = useState<'fees' | 'competition' | 'manual'>('fees')
  const [manualMessage, setManualMessage] = useState('')
  const [customFeeInput, setCustomFeeInput] = useState('')
  const [hasAutoSelected, setHasAutoSelected] = useState(false)

  const { students, loading: studentsLoading } = useStudents()
  const { payments, loading: paymentsLoading } = usePayments(month, year)
  const { reminders, loading: remindersLoading, initiateReminder, confirmReminderSent, fetchReminders } = useReminders(month, year)
  const { whatsappTemplate, competitionTemplate, manualTemplate, competitionFee, manualFee } = useSettings()
  const { showToast } = useToast()

  const activeStudents = useMemo(() => students.filter(s => s.status === 'active'), [students])

  const pendingStudents = useMemo(() => {
    return activeStudents.filter(s => {
      const p = payments.find(p => p.student_id === s.id)
      return !p || p.status === 'pending'
    })
  }, [activeStudents, payments])

  // Reset auto-select flag when month/year changes
  useEffect(() => {
    setHasAutoSelected(false)
  }, [month, year])

  // Auto-select pending students once data is loaded
  useEffect(() => {
    if (!studentsLoading && !paymentsLoading && !hasAutoSelected) {
      if (pendingStudents.length > 0) {
        setSelected(new Set(pendingStudents.map(s => s.id)))
      }
      setHasAutoSelected(true)
    }
  }, [studentsLoading, paymentsLoading, hasAutoSelected, pendingStudents])

  const navigateMonth = (dir: 1 | -1) => {
    let m = month + dir
    let y = year
    if (m > 12) { m = 1; y++ }
    if (m < 1) { m = 12; y-- }
    setMonth(m)
    setYear(y)
    setSelected(new Set())
  }

  const toggleSelect = (studentId: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(studentId)) next.delete(studentId)
      else next.add(studentId)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === pendingStudents.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(pendingStudents.map(s => s.id)))
    }
  }

  const handleSendReminders = () => {
    setManualMessage(manualTemplate)
    setReminderType('fees')
    setCustomFeeInput('')
    setConfigModal(true)
  }

  const handleGenerateQueue = async () => {
    const selectedStudents = pendingStudents.filter(s => selected.has(s.id))
    const queue: ReminderQueueItem[] = []

    let template = whatsappTemplate
    let customAmount: number | undefined = undefined

    if (reminderType === 'competition') {
      template = competitionTemplate
      customAmount = customFeeInput ? Number(customFeeInput) : competitionFee
    } else if (reminderType === 'manual') {
      template = manualMessage
      customAmount = customFeeInput ? Number(customFeeInput) : manualFee
    } else if (reminderType === 'fees') {
      if (customFeeInput) customAmount = Number(customFeeInput)
    }

    for (const student of selectedStudents) {
      const finalAmount = customAmount !== undefined ? customAmount : student.monthly_fee
      const message = buildWhatsAppMessage(template, student, month, year, finalAmount)
      const { reminderId } = await initiateReminder(student.id, finalAmount, message)
      queue.push({ student, reminderId, message, sent: false, amount: finalAmount })
    }

    setConfigModal(false)
    setReminderQueue(queue)
    setReminderModal(true)
  }

  const handleMarkSent = async (index: number) => {
    const item = reminderQueue[index]
    if (!item.reminderId) return
    await confirmReminderSent(item.reminderId)
    setReminderQueue(prev => prev.map((q, i) => i === index ? { ...q, sent: true } : q))
    showToast('success', `Reminder marked as sent for ${item.student.student_name}`)
  }

  const loading = studentsLoading || paymentsLoading || remindersLoading

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-base font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
            <Bell className="w-5 h-5 text-brand-600" />
            Fee Reminders
          </h1>
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
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-3 text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{pendingStudents.length}</p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Pending</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{reminders.filter(r => r.status === 'sent').length}</p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Reminded</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{pendingStudents.length - reminders.filter(r => r.status === 'sent').length}</p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Not Sent</p>
          </div>
        </div>

        {loading ? (
          <LoadingState message="Loading reminders..." />
        ) : pendingStudents.length === 0 ? (
          <EmptyState
            icon={<CheckCircle className="w-8 h-8 text-emerald-500" />}
            title="All fees are collected 🎉"
            description={`No pending fees for ${formatMonth(month, year)}.`}
          />
        ) : (
          <>
            {/* Select All + Send button */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div
                  onClick={toggleAll}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-colors ${
                    selected.size === pendingStudents.length
                      ? 'bg-brand-600 border-brand-600 text-white'
                      : 'border-gray-300 dark:border-slate-600'
                  }`}
                >
                  {selected.size === pendingStudents.length && (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-sm font-medium text-gray-600 dark:text-slate-400">
                  {selected.size === pendingStudents.length ? 'Deselect All' : 'Select All'}
                </span>
                {selected.size > 0 && (
                  <span className="badge bg-brand-100 dark:bg-brand-950/30 text-brand-700 dark:text-brand-400">
                    {selected.size} selected
                  </span>
                )}
              </label>

              {selected.size > 0 && (
                <button onClick={handleSendReminders} className="btn-whatsapp btn-sm">
                  <MessageCircle className="w-4 h-4" />
                  Send {selected.size} Reminder{selected.size > 1 ? 's' : ''}
                </button>
              )}
            </div>

            {/* Student list */}
            <div className="card divide-y divide-gray-50 dark:divide-slate-800">
              {pendingStudents.map(student => {
                const reminder = reminders.find(r => r.student_id === student.id)
                const isSelected = selected.has(student.id)

                return (
                  <div
                    key={student.id}
                    className={`flex items-start gap-3 p-4 transition-colors ${
                      isSelected ? 'bg-brand-50/50 dark:bg-brand-950/10' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <div
                      onClick={() => toggleSelect(student.id)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer flex-shrink-0 mt-0.5 transition-colors ${
                        isSelected
                          ? 'bg-brand-600 border-brand-600 text-white'
                          : 'border-gray-300 dark:border-slate-600'
                      }`}
                    >
                      {isSelected && (
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>

                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-950/40 flex items-center justify-center text-brand-700 dark:text-brand-300 font-bold text-xs flex-shrink-0">
                      {student.student_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 dark:text-slate-100">{student.student_name}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">{student.parent_name}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-xs font-bold text-gray-700 dark:text-slate-300">
                          {formatCurrency(student.monthly_fee)}
                        </span>
                        <FeeStatusBadge status="pending" />
                        <ReminderStatusBadge status={reminder?.status} />
                      </div>
                      {reminder?.initiated_at && (
                        <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                          Last sent: {formatDateTime(reminder.initiated_at)}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      <ReminderModal
        isOpen={reminderModal}
        onClose={() => { setReminderModal(false); setSelected(new Set()); fetchReminders() }}
        queue={reminderQueue}
        month={month}
        year={year}
        onMarkSent={handleMarkSent}
        onCancel={(i) => setReminderQueue(prev => prev.map((q, idx) => idx === i ? { ...q, sent: false } : q))}
      />

      <Modal isOpen={configModal} onClose={() => setConfigModal(false)} title="Configure Reminder">
        <div className="space-y-4">
          <div>
            <label className="form-label">Reminder Type</label>
            <select
              className="form-select"
              value={reminderType}
              onChange={e => {
                const type = e.target.value as any;
                setReminderType(type);
                if (type === 'competition') setCustomFeeInput(String(competitionFee || ''));
                else if (type === 'manual') setCustomFeeInput(String(manualFee || ''));
                else setCustomFeeInput('');
              }}
            >
              <option value="fees">Fees (Default Template)</option>
              <option value="competition">Competition</option>
              <option value="manual">Manual Entry</option>
            </select>
          </div>

          <div>
            <label className="form-label">
              Fee Amount for this Reminder (₹) {reminderType === 'fees' && '(Optional)'}
            </label>
            <input
              type="number"
              className="form-input"
              value={customFeeInput}
              onChange={e => setCustomFeeInput(e.target.value)}
              placeholder={
                reminderType === 'competition' ? `Default is ${competitionFee}` :
                reminderType === 'manual' ? `Default is ${manualFee}` :
                "Leave blank to use each student's normal fee"
              }
            />
            {reminderType === 'fees' && (
              <p className="text-xs text-gray-500 mt-1">
                Leave this blank to automatically use each student's regular monthly fee.
              </p>
            )}
          </div>
          
          {reminderType === 'manual' && (
            <div>
              <label className="form-label">Custom Message</label>
              <textarea
                className="form-textarea w-full h-32"
                placeholder="Type your message here... You can use {{parent_name}} and {{student_name}} variables."
                value={manualMessage}
                onChange={e => setManualMessage(e.target.value)}
              />
            </div>
          )}
          
          <div className="flex gap-3 mt-4">
            <button onClick={() => setConfigModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button 
              onClick={handleGenerateQueue} 
              className="btn-primary flex-1" 
              disabled={reminderType === 'manual' && !manualMessage.trim()}
            >
              Continue
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
