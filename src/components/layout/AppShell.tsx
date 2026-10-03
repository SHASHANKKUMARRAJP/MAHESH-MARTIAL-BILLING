import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Users, Bell, CreditCard, BarChart2,
  Settings, ChevronRight, LogOut, Wallet
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { getInitials } from '../../lib/utils'
import { clearActiveBranch, getActiveBranch } from '../../lib/branch'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/students', label: 'Students', icon: Users },
  { to: '/reminders', label: 'Reminders', icon: Bell },
  { to: '/fees', label: 'Fees', icon: CreditCard },
  { to: '/reports', label: 'Reports', icon: BarChart2 },
  { to: '/expenses', label: 'Expenses', icon: Wallet },
  { to: '/settings', label: 'Settings', icon: Settings },
]

const BOTTOM_NAV = [
  { to: '/', label: 'Home', icon: LayoutDashboard },
  { to: '/students', label: 'Students', icon: Users },
  { to: '/reminders', label: 'Remind', icon: Bell },
  { to: '/reports', label: 'Reports', icon: BarChart2 },
  { to: '/expenses', label: 'Expenses', icon: Wallet },
  { to: '/settings', label: 'Settings', icon: Settings },
]

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const { academy, profile, signOut, isDemoMode } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex">
      {/* Sidebar — desktop only */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:left-0 bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 z-30">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100 dark:border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            🥋
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-bold text-gray-900 dark:text-slate-100 text-sm truncate">
              {academy?.name ?? 'Karate Academy'}
            </h1>
            <p className="text-xs text-gray-400 dark:text-slate-500 truncate uppercase">
              {getActiveBranch()?.replace('branch', 'Branch ')}
            </p>
          </div>
          <button onClick={clearActiveBranch} className="text-xs text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-2 py-1 rounded">
            Switch
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `sidebar-item ${isActive ? 'sidebar-item-active' : ''}`
                }
              >
                <Icon className="w-4.5 h-4.5 flex-shrink-0" />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        {/* User */}
        <div className="px-3 pb-4">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gray-50 dark:bg-slate-800">
            <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-950/40 flex items-center justify-center text-brand-700 dark:text-brand-300 font-bold text-xs flex-shrink-0">
              {getInitials(profile?.name ?? 'S')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 dark:text-slate-200 truncate">
                {profile?.name ?? 'Admin / Sensei'}
              </p>
              <p className="text-xs text-gray-400 dark:text-slate-500 truncate">
                Academy Admin
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-64 min-h-screen">
        {children}
      </main>

      {/* Bottom nav — mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 safe-bottom">
        <div className="flex items-center justify-around px-2">
          {BOTTOM_NAV.map(item => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `nav-item flex-1 ${isActive ? 'nav-item-active' : ''}`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-5 h-5 ${isActive ? 'text-brand-600 dark:text-brand-400' : 'text-gray-400 dark:text-slate-500'}`} />
                    <span className="text-[10px] font-medium">{item.label}</span>
                  </>
                )}
              </NavLink>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
