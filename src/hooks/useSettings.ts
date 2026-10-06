import { useState, useEffect, useCallback } from 'react'
import { supabase, isDemoMode } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Settings } from '../types'
import { DEMO_SETTINGS, DEMO_ACADEMY } from '../lib/demoData'
import { DEFAULT_WHATSAPP_TEMPLATE, DEFAULT_COMPETITION_TEMPLATE, DEFAULT_MANUAL_TEMPLATE } from '../lib/utils'
import { getBranchPrefix } from '../lib/branch'

function getStoredSettings(): Settings {
  try {
    const prefix = getBranchPrefix()
    const data = localStorage.getItem(`${prefix}_settings`)
    if (data) return JSON.parse(data)
  } catch {}
  return { ...DEMO_SETTINGS }
}

function saveStoredSettings(s: Settings) {
  try {
    const prefix = getBranchPrefix()
    localStorage.setItem(`${prefix}_settings`, JSON.stringify(s))
  } catch {}
}

let demoSettings = getStoredSettings()
let demoAcademy = { ...DEMO_ACADEMY }

export function useSettings() {
  const { academy } = useAuth()
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = useCallback(async () => {
    setLoading(true)

    if (isDemoMode) {
      demoSettings = getStoredSettings()
      setSettings({ ...demoSettings })
      setLoading(false)
      return
    }

    try {
      const academyId = academy?.id ?? 'demo-academy'
      const { data, error: err } = await supabase
        .from('settings')
        .select('*')
        .eq('academy_id', academyId)
        .single()

      if (err) {
        demoSettings = getStoredSettings()
        setSettings({ ...demoSettings })
      } else {
        setSettings(data as Settings)
      }
    } catch {
      demoSettings = getStoredSettings()
      setSettings({ ...demoSettings })
    }
    setLoading(false)
  }, [academy])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const updateSettings = async (
    updates: Partial<Pick<Settings, 'default_fee' | 'whatsapp_template' | 'competition_template' | 'manual_template' | 'competition_fee' | 'manual_fee'>>
  ): Promise<{ error: string | null }> => {
    demoSettings = { ...demoSettings, ...updates, updated_at: new Date().toISOString() }
    saveStoredSettings(demoSettings)
    setSettings({ ...demoSettings })

    if (!isDemoMode && settings?.id) {
      try {
        await supabase
          .from('settings')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', settings.id)
      } catch {}
    }
    return { error: null }
  }

  const updateAcademyInfo = async (
    updates: { name?: string; instructor_name?: string; phone?: string; address?: string }
  ): Promise<{ error: string | null }> => {
    demoAcademy = { ...demoAcademy, ...updates }
    if (!isDemoMode && academy?.id) {
      try {
        await supabase
          .from('academies')
          .update(updates)
          .eq('id', academy.id)
      } catch {}
    }
    return { error: null }
  }

  return {
    settings,
    loading,
    error,
    fetchSettings,
    updateSettings,
    updateAcademyInfo,
    whatsappTemplate: settings?.whatsapp_template ?? DEFAULT_WHATSAPP_TEMPLATE,
    competitionTemplate: settings?.competition_template ?? DEFAULT_COMPETITION_TEMPLATE,
    manualTemplate: settings?.manual_template ?? DEFAULT_MANUAL_TEMPLATE,
    defaultFee: settings?.default_fee ?? 800,
    competitionFee: settings?.competition_fee ?? 0,
    manualFee: settings?.manual_fee ?? 0,
  }
}

