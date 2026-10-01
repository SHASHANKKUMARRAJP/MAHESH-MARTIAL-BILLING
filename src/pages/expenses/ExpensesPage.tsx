import React, { useState, useMemo } from 'react'
import { Plus, Wallet, Pencil, Trash2, Search } from 'lucide-react'
import { useExpenses } from '../../hooks/useExpenses'
import { useToast } from '../../contexts/ToastContext'
import { Modal, ConfirmDialog } from '../../components/ui/Modal'
import { ExpenseForm } from '../../components/expenses/ExpenseForm'
import { LoadingState } from '../../components/ui/LoadingState'
import { EmptyState } from '../../components/ui/EmptyState'
import { formatCurrency, formatMonth, getCurrentMonth } from '../../lib/utils'
import type { Expense, ExpenseFormData } from '../../types'

export function ExpensesPage() {
  const { expenses, loading, addExpense, updateExpense, deleteExpense } = useExpenses()
  const { showToast } = useToast()
  
  const now = getCurrentMonth()
  const [month, setMonth] = useState(now.month)
  const [year, setYear] = useState(now.year)
  const [search, setSearch] = useState('')

  const [addOpen, setAddOpen] = useState(false)
  const [editExpense, setEditExpense] = useState<Expense | null>(null)
  const [deleteExpense_, setDeleteExpense] = useState<Expense | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const filtered = useMemo(() => {
    let list = expenses.filter(e => {
      const d = new Date(e.expense_date)
      return d.getMonth() + 1 === month && d.getFullYear() === year
    })
    
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(e => 
        e.title.toLowerCase().includes(q) || 
        e.category.toLowerCase().includes(q)
      )
    }
    return list
  }, [expenses, month, year, search])

  const totalExpenses = useMemo(() => {
    return filtered.reduce((sum, e) => sum + Number(e.amount), 0)
  }, [filtered])

  const handleAdd = async (data: ExpenseFormData) => {
    setFormLoading(true)
    const { error } = await addExpense(data)
    setFormLoading(false)
    if (error) showToast('error', `Failed to add expense: ${error}`)
    else { showToast('success', 'Expense added!'); setAddOpen(false) }
  }

  const handleEdit = async (data: ExpenseFormData) => {
    if (!editExpense) return
    setFormLoading(true)
    const { error } = await updateExpense(editExpense.id, data)
    setFormLoading(false)
    if (error) showToast('error', `Failed to update expense: ${error}`)
    else { showToast('success', 'Expense updated!'); setEditExpense(null) }
  }

  const handleDelete = async () => {
    if (!deleteExpense_) return
    setDeleteLoading(true)
    const { error } = await deleteExpense(deleteExpense_.id)
    setDeleteLoading(false)
    if (error) showToast('error', 'Failed to delete expense.')
    else { showToast('success', 'Expense deleted.'); setDeleteExpense(null) }
  }

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-base font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-brand-600" />
            Expenses
          </h1>
          <button onClick={() => setAddOpen(true)} className="btn-primary btn-sm">
            <Plus className="w-4 h-4" />
            Add Expense
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1">
          <select 
            value={month} 
            onChange={e => setMonth(Number(e.target.value))}
            className="form-input py-1.5 text-sm"
          >
            {Array.from({length: 12}).map((_, i) => (
              <option key={i+1} value={i+1}>{new Date(2000, i).toLocaleString('default', { month: 'short' })}</option>
            ))}
          </select>
          <select 
            value={year} 
            onChange={e => setYear(Number(e.target.value))}
            className="form-input py-1.5 text-sm"
          >
            {[year-1, year, year+1].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <div className="relative flex-1 min-w-[150px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search expenses..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="form-input pl-9 py-1.5 text-sm w-full"
            />
          </div>
        </div>

        {/* Summary Card */}
        <div className="card p-4 bg-gradient-to-br from-brand-50 to-brand-100/50 dark:from-brand-950/20 dark:to-brand-900/10 border-brand-100 dark:border-brand-900/30 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-brand-600 dark:text-brand-400 mb-1">
              Total Expenses ({formatMonth(month, year)})
            </p>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
              {formatCurrency(totalExpenses)}
            </h2>
          </div>
          <div className="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center">
            <Wallet className="w-6 h-6 text-brand-600 dark:text-brand-400" />
          </div>
        </div>
      </div>

      <div className="page-content mt-4">
        {loading ? (
          <LoadingState message="Loading expenses..." />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Wallet className="w-8 h-8" />}
            title="No expenses found"
            description="You haven't recorded any expenses for this month."
            action={
              <button onClick={() => setAddOpen(true)} className="btn-primary">
                <Plus className="w-4 h-4" />
                Add First Expense
              </button>
            }
          />
        ) : (
          <div className="space-y-3">
            {filtered.map(expense => (
              <div key={expense.id} className="card p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                  <Wallet className="w-5 h-5 text-gray-500 dark:text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">
                    {expense.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-2">
                    <span className="capitalize text-brand-600 dark:text-brand-400 font-medium">{expense.category}</span>
                    <span>·</span>
                    <span>{new Date(expense.expense_date).toLocaleDateString()}</span>
                  </p>
                  {expense.notes && (
                    <p className="text-xs text-gray-400 dark:text-slate-500 truncate mt-1">
                      {expense.notes}
                    </p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-gray-900 dark:text-slate-100 mb-1">
                    {formatCurrency(expense.amount)}
                  </p>
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => setEditExpense(expense)} className="btn-icon btn-ghost w-7 h-7">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteExpense(expense)} className="btn-icon btn-ghost w-7 h-7 text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add Expense">
        <ExpenseForm onSubmit={handleAdd} onCancel={() => setAddOpen(false)} loading={formLoading} />
      </Modal>

      <Modal isOpen={!!editExpense} onClose={() => setEditExpense(null)} title="Edit Expense">
        {editExpense && (
          <ExpenseForm initial={editExpense} onSubmit={handleEdit} onCancel={() => setEditExpense(null)} loading={formLoading} />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteExpense_}
        onClose={() => setDeleteExpense(null)}
        onConfirm={handleDelete}
        title="Delete Expense"
        description={`Are you sure you want to delete ${deleteExpense_?.title}? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={deleteLoading}
      />
    </div>
  )
}
