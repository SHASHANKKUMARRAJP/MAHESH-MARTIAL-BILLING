import React, { useState, useMemo, useCallback } from 'react'
import { Plus, Users, Pencil, Trash2, Eye, RotateCcw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useStudents } from '../../hooks/useStudents'
import { usePayments } from '../../hooks/usePayments'
import { useReminders } from '../../hooks/useReminders'
import { useSettings } from '../../hooks/useSettings'
import { useToast } from '../../contexts/ToastContext'
import { StudentCard } from '../../components/students/StudentCard'
import { StudentForm } from '../../components/students/StudentForm'
import { SearchBar, FilterBar } from '../../components/ui/SearchFilter'
import { Modal } from '../../components/ui/Modal'
import { ConfirmDialog } from '../../components/ui/Modal'
import { PaymentModal } from '../../components/ui/PaymentModal'
import { ReminderModal, type ReminderQueueItem } from '../../components/ui/ReminderModal'
import { FeeStatusBadge, ReminderStatusBadge } from '../../components/ui/StatusBadges'
import { LoadingState, StudentCardSkeleton } from '../../components/ui/LoadingState'
import { EmptyState } from '../../components/ui/EmptyState'
import { getCurrentMonth, buildWhatsAppMessage, debounce } from '../../lib/utils'
import type { Student, StudentFormData, PaymentFormData } from '../../types'

type FilterType = 'all' | 'active' | 'inactive' | 'paid' | 'pending'

export function StudentsPage() {
  const { month, year } = getCurrentMonth()
  const { students, loading, addStudent, updateStudent, deleteStudent } = useStudents()
  const { payments, markPaid, markPending } = usePayments(month, year)
  const { reminders, initiateReminder, confirmReminderSent, resetReminder, fetchReminders } = useReminders(month, year)
  const { settings, whatsappTemplate } = useSettings()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [addOpen, setAddOpen] = useState(false)
  const [editStudent, setEditStudent] = useState<Student | null>(null)
  const [deleteStudent_, setDeleteStudent] = useState<Student | null>(null)
  const [paymentModal, setPaymentModal] = useState<Student | null>(null)
  const [reminderQueue, setReminderQueue] = useState<ReminderQueueItem[]>([])
  const [reminderModal, setReminderModal] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const debouncedSetSearch = useCallback(debounce((v: string) => setSearch(v), 300), [])

  const filtered = useMemo(() => {
    let list = students
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(s =>
        s.student_name.toLowerCase().includes(q) ||
        s.parent_name.toLowerCase().includes(q) ||
        s.parent_phone.includes(q)
      )
    }
    if (filter === 'active') list = list.filter(s => s.status === 'active')
    if (filter === 'inactive') list = list.filter(s => s.status === 'inactive')
    if (filter === 'paid') {
      list = list.filter(s => {
        const p = payments.find(p => p.student_id === s.id)
        return p?.status === 'paid'
      })
    }
    if (filter === 'pending') {
      list = list.filter(s => {
        const p = payments.find(p => p.student_id === s.id)
        return !p || p.status === 'pending'
      })
    }
    return list
  }, [students, search, filter, payments])

  const filters = useMemo(() => {
    const studentIds = new Set(students.map(s => s.id))
    const validPayments = payments.filter(p => studentIds.has(p.student_id))

    const paidStudentIds = new Set(
      validPayments.filter(p => p.status === 'paid').map(p => p.student_id)
    )

    return [
      { label: 'All', value: 'all', count: students.length },
      { label: 'Active', value: 'active', count: students.filter(s => s.status === 'active').length },
      { label: 'Paid', value: 'paid', count: students.filter(s => paidStudentIds.has(s.id)).length },
      { label: 'Pending', value: 'pending', count: students.filter(s => !paidStudentIds.has(s.id)).length },
      { label: 'Inactive', value: 'inactive', count: students.filter(s => s.status === 'inactive').length },
    ]
  }, [students, payments])

  const handleAdd = async (data: StudentFormData) => {
    setFormLoading(true)
    const { error } = await addStudent(data)
    setFormLoading(false)
    if (error) showToast('error', 'Failed to add student.')
    else { showToast('success', 'Student added!'); setAddOpen(false) }
  }

  const handleEdit = async (data: StudentFormData) => {
    if (!editStudent) return
    setFormLoading(true)
    const { error } = await updateStudent(editStudent.id, data)
    setFormLoading(false)
    if (error) showToast('error', 'Failed to update student.')
    else { showToast('success', 'Student updated!'); setEditStudent(null) }
  }

  const handleDelete = async () => {
    if (!deleteStudent_) return
    setDeleteLoading(true)
    const { error } = await deleteStudent(deleteStudent_.id)
    setDeleteLoading(false)
    if (error) showToast('error', 'Failed to delete student.')
    else { showToast('success', 'Student deleted.'); setDeleteStudent(null) }
  }

  const handleMarkPaid = async (formData: PaymentFormData) => {
    if (!paymentModal) return
    const { error } = await markPaid(paymentModal.id, paymentModal.monthly_fee, formData)
    if (error) showToast('error', 'Failed to record payment.')
    else { showToast('success', `Payment recorded for ${paymentModal.student_name} ✅`); setPaymentModal(null) }
  }

  const handleMarkPending = async (student: Student) => {
    const { error } = await markPending(student.id)
    if (error) showToast('error', 'Failed to undo payment.')
    else showToast('success', `Payment reverted to Pending for ${student.student_name} ↩️`)
  }

  const handleResetReminder = async (student: Student) => {
    const { error } = await resetReminder(student.id)
    if (error) showToast('error', 'Failed to reset reminder.')
    else showToast('success', `Reminder status reset to Not Sent for ${student.student_name}`)
  }

  const handleSendReminder = async (student: Student) => {
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
    showToast('success', `Reminder marked as sent`)
  }

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-base font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-600" />
            Students
          </h1>
          <button onClick={() => setAddOpen(true)} className="btn-primary btn-sm">
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
        <SearchBar
          value={search}
          onChange={debouncedSetSearch}
          placeholder="Search by name, parent, phone..."
        />
        <div className="mt-2">
          <FilterBar
            filters={filters}
            active={filter}
            onChange={(v) => setFilter(v as FilterType)}
          />
        </div>
      </div>

      <div className="page-content">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1,2,3].map(i => <StudentCardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Users className="w-8 h-8" />}
            title={search || filter !== 'all' ? 'No students found' : 'No students added yet'}
            description={search || filter !== 'all' ? 'Try a different search or filter' : 'Add your first student to get started.'}
            action={
              !search && filter === 'all' ? (
                <button onClick={() => setAddOpen(true)} className="btn-primary">
                  <Plus className="w-4 h-4" />
                  Add First Student
                </button>
              ) : undefined
            }
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-800">
                <span className="text-sm font-medium text-gray-500 dark:text-slate-400">
                  {filtered.length} students
                </span>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-semibold text-gray-400 dark:text-slate-500 border-b border-gray-100 dark:border-slate-800">
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Batch</th>
                    <th className="px-4 py-3">Monthly Fee</th>
                    <th className="px-4 py-3">Fee Status</th>
                    <th className="px-4 py-3">Reminder</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                  {filtered.map(student => {
                    const payment = payments.find(p => p.student_id === student.id)
                    const reminder = reminders.find(r => r.student_id === student.id)
                    const isPaid = payment?.status === 'paid'
                    const isSent = reminder?.status === 'sent'

                    return (
                      <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-brand-100 dark:bg-brand-950/40 flex items-center justify-center text-brand-700 dark:text-brand-300 font-bold text-xs flex-shrink-0">
                              {student.student_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2)}
                            </div>
                            <div>
                              <button
                                onClick={() => navigate(`/students/${student.id}`)}
                                className="font-semibold text-sm text-gray-900 dark:text-slate-100 hover:text-brand-600 dark:hover:text-brand-400"
                              >
                                {student.student_name}
                              </button>
                              <p className="text-xs text-gray-400 dark:text-slate-500">{student.parent_name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-slate-300">{student.batch || '—'}</td>
                        <td className="px-4 py-3 text-sm font-semibold">₹{student.monthly_fee}</td>
                        <td className="px-4 py-3">
                          <FeeStatusBadge
                            status={isPaid ? 'paid' : 'pending'}
                            onClick={() => isPaid ? handleMarkPending(student) : setPaymentModal(student)}
                            title={isPaid ? 'Click to Undo Paid status' : 'Click to mark as Paid'}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <ReminderStatusBadge
                            status={reminder?.status}
                            onClick={() => isSent ? handleResetReminder(student) : handleSendReminder(student)}
                            title={isSent ? 'Click to reset reminder status to Not Sent' : 'Click to send reminder'}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => navigate(`/students/${student.id}`)} className="btn-icon btn-ghost" title="View Profile">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button onClick={() => setEditStudent(student)} className="btn-icon btn-ghost" title="Edit Student">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => setDeleteStudent(student)} className="btn-icon btn-ghost text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" title="Delete Student">
                              <Trash2 className="w-4 h-4" />
                            </button>

                            {!isPaid ? (
                              <>
                                <button onClick={() => handleSendReminder(student)} className="btn-whatsapp btn-sm">
                                  Remind
                                </button>
                                <button onClick={() => setPaymentModal(student)} className="btn-secondary btn-sm">
                                  Paid
                                </button>
                              </>
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
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden grid grid-cols-1 gap-3">
              {filtered.map(student => {
                const payment = payments.find(p => p.student_id === student.id)
                const reminder = reminders.find(r => r.student_id === student.id)
                return (
                  <div key={student.id} className="relative">
                    <StudentCard
                      student={student}
                      payment={payment}
                      reminder={reminder}
                      month={month}
                      year={year}
                      onSendReminder={handleSendReminder}
                      onMarkPaid={s => setPaymentModal(s)}
                      onMarkPending={handleMarkPending}
                      onResetReminder={handleResetReminder}
                      onViewProfile={s => navigate(`/students/${s.id}`)}
                    />
                    <div className="absolute top-4 right-4 flex gap-1">
                      <button onClick={() => setEditStudent(student)} className="btn-icon btn-ghost w-8 h-8">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteStudent(student)} className="btn-icon btn-ghost w-8 h-8 text-red-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Add Modal */}
      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add Student">
        <StudentForm
          defaultFee={settings?.default_fee}
          onSubmit={handleAdd}
          onCancel={() => setAddOpen(false)}
          loading={formLoading}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editStudent} onClose={() => setEditStudent(null)} title="Edit Student">
        {editStudent && (
          <StudentForm
            initial={editStudent}
            defaultFee={settings?.default_fee}
            onSubmit={handleEdit}
            onCancel={() => setEditStudent(null)}
            loading={formLoading}
          />
        )}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteStudent_}
        onClose={() => setDeleteStudent(null)}
        onConfirm={handleDelete}
        title="Delete Student"
        description={`Are you sure you want to delete ${deleteStudent_?.student_name}? This will also delete all their payment and reminder records.`}
        confirmLabel="Delete"
        loading={deleteLoading}
      />

      {/* Payment Modal */}
      <PaymentModal
        isOpen={!!paymentModal}
        onClose={() => setPaymentModal(null)}
        studentName={paymentModal?.student_name ?? ''}
        month={month}
        year={year}
        amount={paymentModal?.monthly_fee ?? 0}
        onConfirm={handleMarkPaid}
      />

      {/* Reminder Modal */}
      <ReminderModal
        isOpen={reminderModal}
        onClose={() => { setReminderModal(false); fetchReminders() }}
        queue={reminderQueue}
        month={month}
        year={year}
        onMarkSent={handleMarkSent}
        onCancel={(i) => setReminderQueue(prev => prev.map((q, idx) => idx === i ? { ...q, sent: false } : q))}
      />
    </div>
  )
}
