import React from 'react'
import { setActiveBranch } from '../lib/branch'

export function BranchSelector() {
  const branches = [
    { id: 'branch1', name: 'Branch 1', icon: '🥋', delay: '0ms' },
    { id: 'branch2', name: 'Branch 2', icon: '⛩️', delay: '150ms' },
    { id: 'branch3', name: 'Branch 3', icon: '🏆', delay: '300ms' },
  ]

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-black">
      
      {/* Highly Visible Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-red-950/20 to-black animate-epic-bg" />
      
      {/* Moving Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f12_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f12_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Floating Geometric Animations */}
      <div className="absolute top-[15%] left-[10%] w-40 h-40 border-2 border-red-500/20 rounded-xl animate-[spin_20s_linear_infinite] pointer-events-none" />
      <div className="absolute bottom-[15%] right-[10%] w-64 h-64 border border-brand-500/10 rounded-full animate-[pulse_6s_ease-in-out_infinite] pointer-events-none" />
      <div className="absolute top-[40%] right-[20%] w-24 h-24 bg-red-900/10 backdrop-blur-sm rounded-lg animate-[spin_15s_linear_infinite_reverse] pointer-events-none" />
      <div className="absolute bottom-[30%] left-[20%] w-32 h-32 border border-white/5 rounded-full animate-[ping_10s_cubic-bezier(0,0,0.2,1)_infinite] pointer-events-none" />

      {/* Central Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-900/20 rounded-full blur-[100px] pointer-events-none animate-pulse" />

      <div className="text-center mb-8 md:mb-12 animate-fade-in-up relative z-10 mt-8 md:mt-0">
        <div className="relative inline-block mb-4 md:mb-6 group">
          <div className="absolute inset-[-4px] bg-gradient-to-r from-red-600 to-brand-500 rounded-3xl opacity-50 blur-lg group-hover:opacity-100 transition-opacity duration-500"></div>
          <img 
            src="/logo.png.jpeg" 
            alt="Logo" 
            className="w-20 h-20 md:w-28 md:h-28 object-contain rounded-2xl relative z-10 bg-black border border-white/10" 
          />
        </div>
        <h1 className="text-[26px] leading-tight md:text-5xl font-black text-white mb-2 md:mb-3 tracking-tight uppercase px-4 max-w-sm mx-auto">
          Mahesh Martial Arts
        </h1>
        <div className="h-1.5 w-16 md:w-24 bg-gradient-to-r from-red-600 to-brand-500 mx-auto mt-2 md:mt-4 rounded-full" />
      </div>

      <div className="flex flex-col md:grid md:grid-cols-3 gap-3 md:gap-6 max-w-5xl w-full relative z-10 px-4 pb-8">
        {branches.map((branch) => (
          <button
            key={branch.id}
            onClick={() => setActiveBranch(branch.id)}
            className="group animate-fade-in-up flex flex-row md:flex-col items-center justify-start md:justify-center gap-4 md:gap-6 p-4 px-6 md:p-10 bg-white/5 hover:bg-white/10 backdrop-blur-xl rounded-2xl md:rounded-3xl shadow-2xl border border-white/10 hover:border-red-500/50 hover:-translate-y-1 md:hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(220,38,38,0.4)] transition-all duration-300 w-full text-left md:text-center"
            style={{ animationDelay: branch.delay }}
          >
            <div className="text-4xl md:text-6xl group-hover:scale-110 md:group-hover:scale-125 group-hover:-rotate-12 transition-transform duration-500 drop-shadow-2xl flex-shrink-0">
              {branch.icon}
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-300 group-hover:text-white transition-colors duration-300 flex-1">
              {branch.name}
            </h2>
          </button>
        ))}
      </div>
    </div>
  )
}
