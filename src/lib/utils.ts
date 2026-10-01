import type { Student, Payment, Reminder } from '../types'

// ============================================
// DATE / MONTH UTILITIES
// ============================================

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

export function getCurrentMonth(): { month: number; year: number } {
  const now = new Date()
  return { month: now.getMonth() + 1, year: now.getFullYear() }
}

export function formatMonth(month: number, year: number): string {
  return `${MONTH_NAMES[month - 1]} ${year}`
}

export function formatMonthShort(month: number, year: number): string {
  return `${MONTH_SHORT[month - 1]} ${year}`
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good Morning'
  if (hour < 17) return 'Good Afternoon'
  return 'Good Evening'
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

// ============================================
// CURRENCY
// ============================================

export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`
}

// ============================================
// PHONE NUMBER UTILITIES
// ============================================

export function normalizePhone(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '')
  // Handle Indian numbers: if 10 digits, prefix 91; if already has 91/+91, keep
  if (digits.length === 10) return `91${digits}`
  if (digits.startsWith('91') && digits.length === 12) return digits
  if (digits.startsWith('0') && digits.length === 11) return `91${digits.slice(1)}`
  return digits
}

export function displayPhone(phone: string): string {
  const normalized = normalizePhone(phone)
  if (normalized.startsWith('91') && normalized.length === 12) {
    return `+91 ${normalized.slice(2, 7)} ${normalized.slice(7)}`
  }
  return `+${normalized}`
}

export function validateIndianPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) return /^[6-9]\d{9}$/.test(digits)
  if (digits.length === 12 && digits.startsWith('91')) return /^91[6-9]\d{9}$/.test(digits)
  return false
}

// ============================================
// WHATSAPP UTILITIES
// ============================================

export const DEFAULT_WHATSAPP_TEMPLATE = `🥋 Karate Academy Fee Reminder

Dear {{parent_name}},

This is a gentle reminder regarding {{student_name}}'s karate class fee for {{month}} {{year}}.

💰 Amount: ₹{{amount}}

Kindly complete the payment at your convenience.

Thank you 🙏

Karate Academy`

export function buildWhatsAppMessage(
  template: string,
  student: Student,
  month: number,
  year: number
): string {
  return template
    .replace(/{{parent_name}}/g, student.parent_name)
    .replace(/{{student_name}}/g, student.student_name)
    .replace(/{{month}}/g, MONTH_NAMES[month - 1])
    .replace(/{{year}}/g, String(year))
    .replace(/{{amount}}/g, String(student.monthly_fee))
    .replace(/{{academy_name}}/g, 'Karate Academy')
}

export function buildWhatsAppLink(phone: string, message: string): string {
  const normalized = normalizePhone(phone)
  const encoded = encodeURIComponent(message)
  return `https://wa.me/${normalized}?text=${encoded}`
}

// ============================================
// MISC
// ============================================

export function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()
}

export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }
}

export function classNames(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}

// ============================================
// PAYMENT / REMINDER HELPERS
// ============================================

export function getPaymentStatusLabel(status: Payment['status']): string {
  return status === 'paid' ? 'Paid' : 'Pending'
}

export function getReminderStatusLabel(status: Reminder['status']): string {
  return status === 'sent' ? 'Sent' : 'Not Sent'
}

export function getPaymentMethodLabel(method: string | null): string {
  const map: Record<string, string> = {
    cash: 'Cash',
    upi: 'UPI',
    bank_transfer: 'Bank Transfer',
    other: 'Other',
  }
  return method ? (map[method] || method) : '—'
}

export function calculateCollectionRate(collected: number, expected: number): number {
  if (expected <= 0) return 0
  return Math.min(100, Math.max(0, Math.round((collected / expected) * 100)))
}
