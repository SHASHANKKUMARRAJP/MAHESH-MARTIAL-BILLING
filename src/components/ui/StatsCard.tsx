import React from 'react'

interface StatsCardProps {
  label: string
  value: string | number
  sub?: string
  accent?: boolean
  icon?: React.ReactNode
  trend?: { value: string; positive: boolean }
}

export function StatsCard({ label, value, sub, accent, icon, trend }: StatsCardProps) {
  return (
    <div className={`stats-card ${accent ? 'bg-brand-600 dark:bg-brand-700 border-0' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-medium ${accent ? 'text-brand-100' : 'text-gray-400 dark:text-slate-500'} truncate`}>
            {label}
          </p>
          <p className={`text-2xl font-bold mt-1 ${accent ? 'text-white' : 'text-gray-900 dark:text-slate-100'}`}>
            {value}
          </p>
          {sub && (
            <p className={`text-xs mt-0.5 ${accent ? 'text-brand-200' : 'text-gray-400 dark:text-slate-500'}`}>
              {sub}
            </p>
          )}
          {trend && (
            <p className={`text-xs mt-0.5 font-medium ${trend.positive ? 'text-emerald-500' : 'text-red-400'}`}>
              {trend.positive ? '↑' : '↓'} {trend.value}
            </p>
          )}
        </div>
        {icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            accent ? 'bg-white/20 text-white' : 'bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400'
          }`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
