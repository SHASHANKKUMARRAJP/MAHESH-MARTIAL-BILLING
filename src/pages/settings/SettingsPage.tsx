import React, { useState, useEffect, useRef } from 'react'
import {
  Settings, Building2, DollarSign, MessageCircle, Moon, Sun, Monitor,
  UserCheck, Trash2, ChevronRight, RefreshCw, CheckCircle2,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useSettings } from '../../hooks/useSettings'
import { useTheme } from '../../contexts/ThemeContext'
import { useToast } from '../../contexts/ToastContext'
import { LoadingState } from '../../components/ui/LoadingState'
import { Modal, ConfirmDialog } from '../../components/ui/Modal'
import type { Theme } from '../../types'
import { DEFAULT_WHATSAPP_TEMPLATE, DEFAULT_COMPETITION_TEMPLATE, DEFAULT_MANUAL_TEMPLATE } from '../../lib/utils'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <div className="px-5 py-3 border-b border-gray-100 dark:border-slate-800">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">{title}</h2>
      </div>
      <div className="p-5 space-y-4">
        {children}
      </div>
    </div>
  )
}

export function SettingsPage() {
  const { academy, profile, updateAcademy, updateProfile } = useAuth()
  const { settings, loading, updateSettings, updateAcademyInfo, whatsappTemplate, competitionTemplate, manualTemplate, competitionFee, manualFee } = useSettings()
  const { theme, setTheme } = useTheme()
  const { showToast } = useToast()

  const [academyForm, setAcademyForm] = useState({
    name: academy?.name ?? 'Mahesh Martial Arts',
    instructor_name: academy?.instructor_name ?? 'Mahesh',
    phone: academy?.phone ?? '9876543210',
    address: academy?.address ?? 'Kalyna Jeweller Opp Maruthi Colony, Near Key Jeans Garment 3rd Floor, Ballari',
  })

  const [profileForm, setProfileForm] = useState({
    name: profile?.name ?? 'Sensei Mahesh',
  })

  const [feeForm, setFeeForm] = useState({ 
    default_fee: String(settings?.default_fee ?? 800),
    competition_fee: String(settings?.competition_fee ?? 0),
    manual_fee: String(settings?.manual_fee ?? 0)
  })
  const [currentTemplate, setCurrentTemplate] = useState('')
  const [templateOpen, setTemplateOpen] = useState<'none' | 'fees' | 'competition' | 'manual'>('none')
  const [clearDialogOpen, setClearDialogOpen] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    if (academy) {
      setAcademyForm({
        name: academy.name ?? '',
        instructor_name: academy.instructor_name ?? '',
        phone: academy.phone ?? '',
        address: academy.address ?? '',
      })
    }
  }, [academy])

  useEffect(() => {
    if (profile) {
      setProfileForm({
        name: profile.name ?? '',
      })
    }
  }, [profile])

  useEffect(() => {
    if (settings) {
      setFeeForm({ 
        default_fee: String(settings.default_fee ?? 800),
        competition_fee: String(settings.competition_fee ?? 0),
        manual_fee: String(settings.manual_fee ?? 0)
      })
    }
  }, [settings])

  const handleSaveAcademy = async () => {
    setSaving('academy')
    await updateAcademyInfo(academyForm)
    updateAcademy(academyForm)
    setSaving(null)
    showToast('success', 'Academy details updated successfully!')
  }

  const handleSaveProfile = () => {
    setSaving('profile')
    updateProfile({ name: profileForm.name })
    setSaving(null)
    showToast('success', 'Admin profile name updated!')
  }

  const handleSaveFee = async () => {
    setSaving('fee')
    await updateSettings({ 
      default_fee: Number(feeForm.default_fee) || 0,
      competition_fee: Number(feeForm.competition_fee) || 0,
      manual_fee: Number(feeForm.manual_fee) || 0
    })
    setSaving(null)
    showToast('success', 'Default fees updated!')
  }

  const handleSaveTemplate = async () => {
    setSaving('template')
    if (templateOpen === 'fees') await updateSettings({ whatsapp_template: currentTemplate })
    else if (templateOpen === 'competition') await updateSettings({ competition_template: currentTemplate })
    else if (templateOpen === 'manual') await updateSettings({ manual_template: currentTemplate })
    
    setSaving(null)
    showToast('success', 'WhatsApp template saved!')
    setTemplateOpen('none')
  }

  const handleClearAllData = () => {
    try {
      localStorage.removeItem('karate_students')
      localStorage.removeItem('karate_payments')
      localStorage.removeItem('karate_reminders')
      showToast('success', 'All local data cleared. Refreshing page...')
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch {
      showToast('error', 'Failed to clear data.')
    }
  }

  if (loading) return <LoadingState message="Loading settings..." />

  const themes: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: 'Light', icon: <Sun className="w-4 h-4" /> },
    { value: 'dark', label: 'Dark', icon: <Moon className="w-4 h-4" /> },
    { value: 'system', label: 'System', icon: <Monitor className="w-4 h-4" /> },
  ]

  return (
    <div>
      <div className="page-header">
        <h1 className="text-base font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
          <Settings className="w-5 h-5 text-brand-600" />
          Settings
        </h1>
      </div>

      <div className="page-content space-y-4">
        {/* Admin Profile */}
        <Section title="Admin Profile">
          <div>
            <label className="form-label">Instructor / Admin Name</label>
            <input
              type="text"
              className="form-input"
              value={profileForm.name}
              onChange={e => setProfileForm({ name: e.target.value })}
              placeholder="e.g. Sensei Rajan Kumar"
            />
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
              This name appears in greetings and the sidebar header.
            </p>
          </div>
          <button
            onClick={handleSaveProfile}
            disabled={saving === 'profile'}
            className="btn-primary w-full"
          >
            {saving === 'profile' ? 'Saving...' : 'Save Profile Name'}
          </button>
        </Section>

        {/* Academy */}
        <Section title="Academy Details">
          <div>
            <label className="form-label">Academy Name</label>
            <input
              type="text"
              className="form-input"
              value={academyForm.name}
              onChange={e => setAcademyForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Shotokan Karate Academy"
            />
          </div>
          <div>
            <label className="form-label">Head Instructor Name</label>
            <input
              type="text"
              className="form-input"
              value={academyForm.instructor_name}
              onChange={e => setAcademyForm(f => ({ ...f, instructor_name: e.target.value }))}
              placeholder="e.g. Sensei Rajan Kumar"
            />
          </div>
          <div>
            <label className="form-label">Contact Phone</label>
            <input
              type="tel"
              className="form-input"
              value={academyForm.phone}
              onChange={e => setAcademyForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="e.g. 9876543210"
            />
          </div>
          <div>
            <label className="form-label">Academy Address</label>
            <input
              type="text"
              className="form-input"
              value={academyForm.address}
              onChange={e => setAcademyForm(f => ({ ...f, address: e.target.value }))}
              placeholder="e.g. Koramangala, Bengaluru"
            />
          </div>
          <button
            onClick={handleSaveAcademy}
            disabled={saving === 'academy'}
            className="btn-primary w-full"
          >
            {saving === 'academy' ? 'Saving...' : 'Save Academy Info'}
          </button>
        </Section>

        {/* Default Fees */}
        <Section title="Default Fee Amounts">
          <div className="space-y-4">
            <div>
              <label className="form-label">Default Competition Fee</label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700 text-gray-500 dark:text-slate-400 text-sm font-semibold">₹</span>
                <input
                  type="number"
                  className="form-input rounded-l-none"
                  value={feeForm.competition_fee}
                  min={0}
                  onChange={e => {
                    const val = e.target.value;
                    setFeeForm(f => ({ ...f, competition_fee: val === '' ? '' : String(Number(val)) }));
                  }}
                />
              </div>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Amount for competition reminder ({"{{amount}}"})</p>
            </div>

            <div>
              <label className="form-label">Default Manual Entry Amount</label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700 text-gray-500 dark:text-slate-400 text-sm font-semibold">₹</span>
                <input
                  type="number"
                  className="form-input rounded-l-none"
                  value={feeForm.manual_fee}
                  min={0}
                  onChange={e => {
                    const val = e.target.value;
                    setFeeForm(f => ({ ...f, manual_fee: val === '' ? '' : String(Number(val)) }));
                  }}
                />
              </div>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Amount for manual reminder ({"{{amount}}"})</p>
            </div>
          </div>
          <button onClick={handleSaveFee} disabled={saving === 'fee'} className="btn-primary w-full mt-4">
            {saving === 'fee' ? 'Saving...' : 'Save Default Fees'}
          </button>
        </Section>

        {/* WhatsApp Templates */}
        <Section title="WhatsApp Message Templates">
          <div className="space-y-3">
            {[
              { id: 'fees', title: 'Fee Reminder Template', desc: 'Customize reminder text sent to parents for monthly fees' },
              { id: 'competition', title: 'Competition Template', desc: 'Customize reminder text for upcoming competitions' },
              { id: 'manual', title: 'Manual Entry Template', desc: 'Customize the default text for manual entry messages' }
            ].map(tpl => (
              <button
                key={tpl.id}
                onClick={() => {
                  if (tpl.id === 'fees') setCurrentTemplate(whatsappTemplate)
                  else if (tpl.id === 'competition') setCurrentTemplate(competitionTemplate)
                  else if (tpl.id === 'manual') setCurrentTemplate(manualTemplate)
                  setTemplateOpen(tpl.id as any)
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-5 h-5 text-[#25D366]" />
                  <div className="text-left">
                    <span className="text-sm font-medium text-gray-800 dark:text-slate-200 block">{tpl.title}</span>
                    <span className="text-xs text-gray-400 dark:text-slate-500">{tpl.desc}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            ))}
          </div>
        </Section>

        {/* Appearance */}
        <Section title="Appearance">
          <div>
            <label className="form-label">App Theme</label>
            <div className="grid grid-cols-3 gap-2">
              {themes.map(t => (
                <button
                  key={t.value}
                  onClick={() => setTheme(t.value)}
                  className={`
                    flex flex-col items-center gap-2 p-3 rounded-xl border transition-all
                    ${theme === t.value
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-400 font-semibold'
                      : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:border-gray-300'}
                  `}
                >
                  {t.icon}
                  <span className="text-xs">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        </Section>

        {/* Clear Data */}
        <Section title="Data Management">
          <p className="text-xs text-gray-500 dark:text-slate-400">
            Clear locally saved student records, payments, and reminders to reset data fresh.
          </p>
          <button
            onClick={() => setClearDialogOpen(true)}
            className="btn-secondary w-full text-red-500 dark:text-red-400 border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 className="w-4 h-4" />
            Clear All Saved Data
          </button>
        </Section>

        {/* App info */}
        <p className="text-center text-xs text-gray-300 dark:text-slate-700 pb-2">
          Karate Academy Manager v1.0 · 2026
        </p>
      </div>

      <Modal isOpen={templateOpen !== 'none'} onClose={() => setTemplateOpen('none')} title="Edit WhatsApp Template">
        <div className="space-y-4">
          <textarea
            className="form-textarea w-full min-h-[220px] font-sans text-sm"
            value={currentTemplate}
            onChange={e => setCurrentTemplate(e.target.value)}
          />
          <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-3">
            <div className="flex justify-between items-center mb-1.5">
              <p className="text-xs text-gray-400 dark:text-slate-500">Click a variable to insert:</p>
              <button 
                type="button"
                onClick={() => {
                  if (templateOpen === 'fees') setCurrentTemplate(DEFAULT_WHATSAPP_TEMPLATE);
                  else if (templateOpen === 'competition') setCurrentTemplate(DEFAULT_COMPETITION_TEMPLATE);
                  else if (templateOpen === 'manual') setCurrentTemplate(DEFAULT_MANUAL_TEMPLATE);
                }}
                className="text-xs text-brand-600 dark:text-brand-400 hover:underline"
              >
                Reset to Default
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {['{{parent_name}}', '{{student_name}}', '{{month}}', '{{year}}', '{{amount}}', '{{first_of_month}}', '{{due_date}}'].map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setCurrentTemplate(f => f + ' ' + v)}
                  className="text-xs bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 hover:border-brand-500 rounded px-2 py-1 text-brand-600 dark:text-brand-400 font-mono transition-colors"
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setTemplateOpen('none')} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleSaveTemplate} disabled={saving === 'template'} className="btn-primary flex-1">
              {saving === 'template' ? 'Saving...' : 'Save Template'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Reset Confirm */}
      <ConfirmDialog
        isOpen={clearDialogOpen}
        onClose={() => setClearDialogOpen(false)}
        onConfirm={handleClearAllData}
        title="Clear All Saved Data?"
        description="This will delete all locally added student records, payment history, and reminder logs. This action cannot be undone."
        confirmLabel="Clear Data"
      />
    </div>
  )
}

