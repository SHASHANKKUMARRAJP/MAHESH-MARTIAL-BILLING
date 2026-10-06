import React from 'react'
import { setActiveBranch } from '../lib/branch'

export function BranchSelector() {
  const branches = [
    { id: 'branch1', name: 'Branch 1', icon: '🥋' },
    { id: 'branch2', name: 'Branch 2', icon: '⛩️' },
    { id: 'branch3', name: 'Branch 3', icon: '🏆' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-10">
        <img src="/logo.png.jpeg" alt="Logo" className="w-24 h-24 object-contain rounded-2xl mx-auto mb-6 shadow-xl bg-black" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Karate Academy</h1>
        <p className="text-gray-500 dark:text-gray-400">Select a branch to manage</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
        {branches.map(branch => (
          <button
            key={branch.id}
            onClick={() => setActiveBranch(branch.id)}
            className="flex flex-col items-center justify-center gap-4 p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 hover:border-brand-500 dark:hover:border-brand-500 hover:shadow-md hover:shadow-brand-500/10 transition-all group"
          >
            <div className="text-5xl group-hover:scale-110 transition-transform">
              {branch.icon}
            </div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-slate-200">
              {branch.name}
            </h2>
          </button>
        ))}
      </div>
    </div>
  )
}
