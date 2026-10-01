import React, {
  createContext, useContext, useEffect, useState, useCallback,
} from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase, isDemoMode } from '../lib/supabase'
import type { Profile, Academy } from '../types'
import { DEMO_ACADEMY } from '../lib/demoData'

function getStoredAcademy(): Academy {
  try {
    const data = localStorage.getItem('karate_academy')
    if (data) return JSON.parse(data)
  } catch {}
  return DEMO_ACADEMY
}

function saveStoredAcademy(academy: Academy) {
  try {
    localStorage.setItem('karate_academy', JSON.stringify(academy))
  } catch {}
}

function getStoredProfile(): Profile {
  try {
    const data = localStorage.getItem('karate_profile')
    if (data) return JSON.parse(data)
  } catch {}
  return {
    id: 'demo-user',
    academy_id: 'demo-academy',
    name: 'Sensei Mahesh',
    email: 'mahesh@karate.demo',
    role: 'owner',
    created_at: '2025-01-01T00:00:00Z',
  }
}

function saveStoredProfile(p: Profile) {
  try {
    localStorage.setItem('karate_profile', JSON.stringify(p))
  } catch {}
}

interface AuthContextValue {
  user: User | null
  session: Session | null
  profile: Profile | null
  academy: Academy | null
  loading: boolean
  isDemoMode: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: Error | null }>
  updateAcademy: (data: Partial<Academy>) => void
  updateProfile: (data: Partial<Profile>) => void
  refreshAcademy: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(getStoredProfile())
  const [academy, setAcademy] = useState<Academy | null>(getStoredAcademy())
  const [loading, setLoading] = useState(false)

  const fetchProfileAndAcademy = useCallback(async (userId: string) => {
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileData) {
        setProfile(profileData as Profile)
        saveStoredProfile(profileData as Profile)

        if (profileData.academy_id) {
          const { data: academyData } = await supabase
            .from('academies')
            .select('*')
            .eq('id', profileData.academy_id)
            .single()
          if (academyData) {
            setAcademy(academyData as Academy)
            saveStoredAcademy(academyData as Academy)
          }
        }
      }
    } catch {
      // graceful fallback
    }
  }, [])

  const refreshAcademy = useCallback(async () => {
    if (isDemoMode) return
    if (profile?.academy_id) {
      const { data } = await supabase
        .from('academies')
        .select('*')
        .eq('id', profile.academy_id)
        .single()
      if (data) {
        setAcademy(data as Academy)
        saveStoredAcademy(data as Academy)
      }
    }
  }, [profile?.academy_id])

  useEffect(() => {
    if (isDemoMode) {
      setUser({ id: 'demo-user', email: 'sensei@karate.demo' } as User)
      setProfile(getStoredProfile())
      setAcademy(getStoredAcademy())
      setLoading(false)
      return
    }

    setProfile(getStoredProfile())
    setAcademy(getStoredAcademy())

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) fetchProfileAndAcademy(session.user.id)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfileAndAcademy(session.user.id)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [fetchProfileAndAcademy])

  const signIn = async (email: string, password: string) => {
    if (isDemoMode) return { error: null }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error as Error | null }
  }

  const signOut = async () => {
    if (isDemoMode) {
      setUser(null)
      return
    }
    await supabase.auth.signOut()
  }

  const resetPassword = async (email: string) => {
    if (isDemoMode) return { error: new Error('Not available in demo mode') }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { error: error as Error | null }
  }

  const updateAcademy = (data: Partial<Academy>) => {
    setAcademy(prev => {
      const updated = prev ? { ...prev, ...data } : { ...DEMO_ACADEMY, ...data }
      saveStoredAcademy(updated)
      return updated
    })
  }

  const updateProfile = (data: Partial<Profile>) => {
    setProfile(prev => {
      const updated = prev ? { ...prev, ...data } : { ...getStoredProfile(), ...data }
      saveStoredProfile(updated)
      return updated
    })
  }

  return (
    <AuthContext.Provider value={{
      user, session, profile, academy, loading, isDemoMode,
      signIn, signOut, resetPassword, updateAcademy, updateProfile, refreshAcademy,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

