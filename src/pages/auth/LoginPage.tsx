import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'

export function LoginPage() {
  const { signIn, signUp, isDemoMode } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [isSignUp, setIsSignUp] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const { resetPassword } = useAuth()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    let error = null
    if (isSignUp) {
      const res = await signUp(form.email, form.password, form.name || 'Academy Owner')
      error = res.error
    } else {
      const res = await signIn(form.email, form.password)
      error = res.error
    }
    setLoading(false)
    
    if (error) {
      showToast('error', error.message || 'Authentication failed')
    } else if (isSignUp) {
      showToast('success', 'Account created! Check your email to confirm if required, or simply wait to be logged in.')
      navigate('/')
    } else {
      navigate('/')
    }
  }

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotLoading(true)
    const { error } = await resetPassword(forgotEmail)
    setForgotLoading(false)
    if (error) {
      showToast('error', error.message)
    } else {
      showToast('success', 'Password reset link sent to your email')
      setForgotOpen(false)
    }
  }

  if (forgotOpen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <img src="/logo.png.jpeg" alt="Logo" className="w-16 h-16 object-contain rounded-2xl mx-auto mb-4 bg-black shadow-md" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Reset Password</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Enter your email to receive a reset link</p>
          </div>
          <div className="card p-6">
            <form onSubmit={handleForgot} className="space-y-4">
              <div>
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="sensei@academy.com"
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  required
                />
              </div>
              <button type="submit" disabled={forgotLoading} className="btn-primary w-full btn-lg">
                {forgotLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
              <button type="button" onClick={() => setForgotOpen(false)} className="btn-ghost w-full">
                Back to Login
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <img src="/logo.png.jpeg" alt="Logo" className="w-20 h-20 object-contain rounded-2xl mx-auto mb-4 bg-black shadow-md" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Karate Academy</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            Manager · {isSignUp ? 'Create your account' : 'Sign in to continue'}
          </p>
        </div>

        {/* Demo mode banner */}
        {isDemoMode && (
          <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 text-center">
            <strong>Demo Mode</strong> – No Supabase connected. Use any credentials.
          </div>
        )}

        <div className="card p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="form-label">Your Name</label>
                <input
                  id="name"
                  type="text"
                  className="form-input"
                  placeholder="Sensei Mahesh"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required={!isDemoMode && isSignUp}
                />
              </div>
            )}
            <div>
              <label className="form-label">Email</label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="sensei@academy.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required={!isDemoMode}
                autoComplete="email"
              />
            </div>
            <div>
              <label className="form-label">Password</label>
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required={!isDemoMode}
                autoComplete="current-password"
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full btn-lg">
              {loading
                ? <span className="flex items-center gap-2 justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {isSignUp ? 'Creating...' : 'Signing in...'}
                  </span>
                : isSignUp ? 'Sign Up' : 'Sign In'
              }
            </button>

            <button 
              type="button" 
              onClick={() => setIsSignUp(!isSignUp)} 
              className="btn-ghost w-full text-xs"
            >
              {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
            </button>

            {!isDemoMode && !isSignUp && (
              <button type="button" onClick={() => setForgotOpen(true)} className="btn-ghost w-full text-xs mt-0">
                Forgot password?
              </button>
            )}
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-slate-600 mt-6">
          Karate Academy Manager © 2026
        </p>
      </div>
    </div>
  )
}
