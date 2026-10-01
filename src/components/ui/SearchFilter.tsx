import React from 'react'
import { Search, X } from 'lucide-react'

interface SearchBarProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}

export function SearchBar({ value, onChange, placeholder = 'Search...' }: SearchBarProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500 pointer-events-none" />
      <input
        type="text"
        className="form-input pl-10 pr-9"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}

interface FilterChipProps {
  label: string
  active: boolean
  onClick: () => void
  count?: number
}

export function FilterChip({ label, active, onClick, count }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap
        ${active
          ? 'bg-brand-600 text-white shadow-sm'
          : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'}
      `}
    >
      {label}
      {count !== undefined && (
        <span className={`
          inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-bold px-1
          ${active ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-400'}
        `}>
          {count}
        </span>
      )}
    </button>
  )
}

interface FilterBarProps {
  filters: { label: string; value: string; count?: number }[]
  active: string
  onChange: (v: string) => void
}

export function FilterBar({ filters, active, onChange }: FilterBarProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
      {filters.map(f => (
        <FilterChip
          key={f.value}
          label={f.label}
          active={active === f.value}
          onClick={() => onChange(f.value)}
          count={f.count}
        />
      ))}
    </div>
  )
}
