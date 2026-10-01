// Application-level types (derived from DB types + UI state)

export type StudentStatus = 'active' | 'inactive'
export type PaymentStatus = 'paid' | 'pending'
export type ReminderStatus = 'sent' | 'pending'
export type PaymentMethod = 'cash' | 'upi' | 'bank_transfer' | 'other'

export interface Academy {
  id: string
  name: string
  instructor_name: string | null
  phone: string | null
  address: string | null
  logo_url: string | null
  created_at: string
}

export interface Profile {
  id: string
  academy_id: string | null
  name: string | null
  email: string | null
  role: string
  created_at: string
}

export interface Student {
  id: string
  academy_id: string
  student_name: string
  parent_name: string
  parent_phone: string
  monthly_fee: number
  batch: string | null
  joining_date: string | null
  photo_url: string | null
  status: StudentStatus
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  academy_id: string
  student_id: string
  month: number
  year: number
  amount: number
  status: PaymentStatus
  payment_date: string | null
  payment_method: PaymentMethod | null
  transaction_reference: string | null
  created_at: string
}

export interface Reminder {
  id: string
  academy_id: string
  student_id: string
  month: number
  year: number
  amount: number
  message: string | null
  status: ReminderStatus
  initiated_at: string | null
  created_at: string
}

export interface Settings {
  id: string
  academy_id: string
  default_fee: number
  whatsapp_template: string
  created_at: string
  updated_at: string
}

// Joined/enriched types used in UI

export interface StudentWithPayment extends Student {
  current_payment?: Payment | null
  current_reminder?: Reminder | null
}

export interface DashboardStats {
  total_students: number
  fees_collected: number
  fees_pending: number
  reminders_sent: number
}

export interface MonthlyReport {
  month: number
  year: number
  total_students: number
  expected_fees: number
  collected: number
  pending: number
  paid_students: number
  pending_students: number
  reminders_sent: number
  reminders_not_sent: number
}

// Form types

export interface StudentFormData {
  student_name: string
  parent_name: string
  parent_phone: string
  monthly_fee: number
  batch: string
  joining_date: string
  status: StudentStatus
}

export interface PaymentFormData {
  payment_date: string
  payment_method: PaymentMethod
  transaction_reference: string
}

// UI state types

export type Theme = 'light' | 'dark' | 'system'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
  duration?: number
}
