import type { Student, Payment, Reminder, Academy, Settings } from '../types'

// ============================================
// DEMO ACADEMY
// ============================================

export const DEMO_ACADEMY: Academy = {
  id: 'demo-academy',
  name: 'Mahesh Martial Arts',
  instructor_name: 'Mahesh',
  phone: '9876543210',
  address: 'Kalyna Jeweller Opp Maruthi Colony, Near Key Jeans Garment 3rd Floor, Ballari',
  logo_url: null,
  created_at: '2025-01-01T00:00:00Z',
}

// ============================================
// DEMO STUDENTS
// ============================================

export const DEMO_STUDENTS: Student[] = [
  {
    id: 'stu-1', academy_id: 'demo-academy',
    student_name: 'Rahul Kumar', parent_name: 'Suresh Kumar',
    parent_phone: '9845012345', monthly_fee: 800,
    batch: 'Beginners', joining_date: '2025-04-01',
    photo_url: null, status: 'active',
    created_at: '2025-04-01T00:00:00Z', updated_at: '2025-04-01T00:00:00Z',
  },
  {
    id: 'stu-2', academy_id: 'demo-academy',
    student_name: 'Arjun Raj', parent_name: 'Mohan Raj',
    parent_phone: '9741098765', monthly_fee: 700,
    batch: 'Beginners', joining_date: '2025-06-15',
    photo_url: null, status: 'active',
    created_at: '2025-06-15T00:00:00Z', updated_at: '2025-06-15T00:00:00Z',
  },
  {
    id: 'stu-3', academy_id: 'demo-academy',
    student_name: 'Sneha Patel', parent_name: 'Dinesh Patel',
    parent_phone: '9632014578', monthly_fee: 1000,
    batch: 'Advanced', joining_date: '2024-11-20',
    photo_url: null, status: 'active',
    created_at: '2024-11-20T00:00:00Z', updated_at: '2024-11-20T00:00:00Z',
  },
  {
    id: 'stu-4', academy_id: 'demo-academy',
    student_name: 'Kiran Kumar', parent_name: 'Ramesh Kumar',
    parent_phone: '9510034567', monthly_fee: 800,
    batch: 'Intermediate', joining_date: '2025-01-10',
    photo_url: null, status: 'active',
    created_at: '2025-01-10T00:00:00Z', updated_at: '2025-01-10T00:00:00Z',
  },
  {
    id: 'stu-5', academy_id: 'demo-academy',
    student_name: 'Rohan Shah', parent_name: 'Vikram Shah',
    parent_phone: '9449056789', monthly_fee: 900,
    batch: 'Intermediate', joining_date: '2025-02-01',
    photo_url: null, status: 'active',
    created_at: '2025-02-01T00:00:00Z', updated_at: '2025-02-01T00:00:00Z',
  },
  {
    id: 'stu-6', academy_id: 'demo-academy',
    student_name: 'Ananya Patel', parent_name: 'Nilesh Patel',
    parent_phone: '9380078901', monthly_fee: 1000,
    batch: 'Advanced', joining_date: '2024-08-05',
    photo_url: null, status: 'active',
    created_at: '2024-08-05T00:00:00Z', updated_at: '2024-08-05T00:00:00Z',
  },
  {
    id: 'stu-7', academy_id: 'demo-academy',
    student_name: 'Vivek Kumar', parent_name: 'Anil Kumar',
    parent_phone: '9271023456', monthly_fee: 700,
    batch: 'Beginners', joining_date: '2026-07-01',
    photo_url: null, status: 'active',
    created_at: '2026-07-01T00:00:00Z', updated_at: '2026-07-01T00:00:00Z',
  },
  {
    id: 'stu-8', academy_id: 'demo-academy',
    student_name: 'Aarav Shah', parent_name: 'Pradeep Shah',
    parent_phone: '9162045678', monthly_fee: 800,
    batch: 'Beginners', joining_date: '2026-08-10',
    photo_url: null, status: 'active',
    created_at: '2026-08-10T00:00:00Z', updated_at: '2026-08-10T00:00:00Z',
  },
  {
    id: 'stu-9', academy_id: 'demo-academy',
    student_name: 'Priya Sharma', parent_name: 'Sunil Sharma',
    parent_phone: '9053012345', monthly_fee: 800,
    batch: 'Intermediate', joining_date: '2025-03-15',
    photo_url: null, status: 'inactive',
    created_at: '2025-03-15T00:00:00Z', updated_at: '2026-09-01T00:00:00Z',
  },
]

// ============================================
// DEMO PAYMENTS (October 2026 = current month)
// ============================================

export const DEMO_PAYMENTS: Payment[] = [
  // October 2026 - paid students
  { id: 'pay-oct-3', academy_id: 'demo-academy', student_id: 'stu-3', month: 10, year: 2026, amount: 1000, status: 'paid', payment_date: '2026-10-01', payment_method: 'upi', transaction_reference: 'UPI123456', created_at: '2026-10-01T09:00:00Z' },
  { id: 'pay-oct-5', academy_id: 'demo-academy', student_id: 'stu-5', month: 10, year: 2026, amount: 900, status: 'paid', payment_date: '2026-10-01', payment_method: 'cash', transaction_reference: null, created_at: '2026-10-01T10:00:00Z' },
  { id: 'pay-oct-6', academy_id: 'demo-academy', student_id: 'stu-6', month: 10, year: 2026, amount: 1000, status: 'paid', payment_date: '2026-10-01', payment_method: 'upi', transaction_reference: 'UPI789012', created_at: '2026-10-01T10:30:00Z' },

  // October 2026 - pending students
  { id: 'pay-oct-1', academy_id: 'demo-academy', student_id: 'stu-1', month: 10, year: 2026, amount: 800, status: 'pending', payment_date: null, payment_method: null, transaction_reference: null, created_at: '2026-10-01T00:00:00Z' },
  { id: 'pay-oct-2', academy_id: 'demo-academy', student_id: 'stu-2', month: 10, year: 2026, amount: 700, status: 'pending', payment_date: null, payment_method: null, transaction_reference: null, created_at: '2026-10-01T00:00:00Z' },
  { id: 'pay-oct-4', academy_id: 'demo-academy', student_id: 'stu-4', month: 10, year: 2026, amount: 800, status: 'pending', payment_date: null, payment_method: null, transaction_reference: null, created_at: '2026-10-01T00:00:00Z' },
  { id: 'pay-oct-7', academy_id: 'demo-academy', student_id: 'stu-7', month: 10, year: 2026, amount: 700, status: 'pending', payment_date: null, payment_method: null, transaction_reference: null, created_at: '2026-10-01T00:00:00Z' },
  { id: 'pay-oct-8', academy_id: 'demo-academy', student_id: 'stu-8', month: 10, year: 2026, amount: 800, status: 'pending', payment_date: null, payment_method: null, transaction_reference: null, created_at: '2026-10-01T00:00:00Z' },

  // September 2026
  { id: 'pay-sep-1', academy_id: 'demo-academy', student_id: 'stu-1', month: 9, year: 2026, amount: 800, status: 'paid', payment_date: '2026-09-03', payment_method: 'cash', transaction_reference: null, created_at: '2026-09-03T00:00:00Z' },
  { id: 'pay-sep-2', academy_id: 'demo-academy', student_id: 'stu-2', month: 9, year: 2026, amount: 700, status: 'paid', payment_date: '2026-09-05', payment_method: 'upi', transaction_reference: 'UPI345', created_at: '2026-09-05T00:00:00Z' },
  { id: 'pay-sep-3', academy_id: 'demo-academy', student_id: 'stu-3', month: 9, year: 2026, amount: 1000, status: 'paid', payment_date: '2026-09-02', payment_method: 'upi', transaction_reference: 'UPI678', created_at: '2026-09-02T00:00:00Z' },
  { id: 'pay-sep-4', academy_id: 'demo-academy', student_id: 'stu-4', month: 9, year: 2026, amount: 800, status: 'paid', payment_date: '2026-09-04', payment_method: 'cash', transaction_reference: null, created_at: '2026-09-04T00:00:00Z' },
  { id: 'pay-sep-5', academy_id: 'demo-academy', student_id: 'stu-5', month: 9, year: 2026, amount: 900, status: 'paid', payment_date: '2026-09-01', payment_method: 'bank_transfer', transaction_reference: 'NEFT001', created_at: '2026-09-01T00:00:00Z' },
  { id: 'pay-sep-6', academy_id: 'demo-academy', student_id: 'stu-6', month: 9, year: 2026, amount: 1000, status: 'paid', payment_date: '2026-09-02', payment_method: 'upi', transaction_reference: 'UPI901', created_at: '2026-09-02T00:00:00Z' },

  // August 2026
  { id: 'pay-aug-1', academy_id: 'demo-academy', student_id: 'stu-1', month: 8, year: 2026, amount: 800, status: 'paid', payment_date: '2026-08-02', payment_method: 'cash', transaction_reference: null, created_at: '2026-08-02T00:00:00Z' },
  { id: 'pay-aug-3', academy_id: 'demo-academy', student_id: 'stu-3', month: 8, year: 2026, amount: 1000, status: 'paid', payment_date: '2026-08-01', payment_method: 'upi', transaction_reference: 'UPI222', created_at: '2026-08-01T00:00:00Z' },
]

// ============================================
// DEMO REMINDERS
// ============================================

export const DEMO_REMINDERS: Reminder[] = [
  {
    id: 'rem-1', academy_id: 'demo-academy', student_id: 'stu-1',
    month: 10, year: 2026, amount: 800,
    message: '🥋 Karate Academy Fee Reminder\n\nDear Suresh Kumar...',
    status: 'sent', initiated_at: '2026-10-01T09:32:00Z',
    created_at: '2026-10-01T09:32:00Z',
  },
  {
    id: 'rem-2', academy_id: 'demo-academy', student_id: 'stu-2',
    month: 10, year: 2026, amount: 700,
    message: '🥋 Karate Academy Fee Reminder\n\nDear Mohan Raj...',
    status: 'sent', initiated_at: '2026-10-01T09:35:00Z',
    created_at: '2026-10-01T09:35:00Z',
  },
]

// ============================================
// DEMO SETTINGS
// ============================================

export const DEMO_SETTINGS: Settings = {
  id: 'settings-demo',
  academy_id: 'demo-academy',
  default_fee: 800,
  whatsapp_template: `🥋 Karate Academy Fee Reminder

Dear {{parent_name}},

This is a gentle reminder regarding {{student_name}}'s karate class fee for {{month}} {{year}}.

💰 Amount: ₹{{amount}}

Kindly complete the payment at your convenience.

Thank you 🙏

Karate Academy`,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}
