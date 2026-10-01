export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      academies: {
        Row: {
          id: string
          name: string
          instructor_name: string | null
          phone: string | null
          address: string | null
          logo_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          instructor_name?: string | null
          phone?: string | null
          address?: string | null
          logo_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          instructor_name?: string | null
          phone?: string | null
          address?: string | null
          logo_url?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          academy_id: string | null
          name: string | null
          email: string | null
          role: string
          created_at: string
        }
        Insert: {
          id: string
          academy_id?: string | null
          name?: string | null
          email?: string | null
          role?: string
          created_at?: string
        }
        Update: {
          academy_id?: string | null
          name?: string | null
          email?: string | null
          role?: string
        }
      }
      students: {
        Row: {
          id: string
          academy_id: string
          student_name: string
          parent_name: string
          parent_phone: string
          monthly_fee: number
          batch: string | null
          joining_date: string | null
          photo_url: string | null
          status: 'active' | 'inactive'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          academy_id: string
          student_name: string
          parent_name: string
          parent_phone: string
          monthly_fee: number
          batch?: string | null
          joining_date?: string | null
          photo_url?: string | null
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
        Update: {
          student_name?: string
          parent_name?: string
          parent_phone?: string
          monthly_fee?: number
          batch?: string | null
          joining_date?: string | null
          photo_url?: string | null
          status?: 'active' | 'inactive'
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          academy_id: string
          student_id: string
          month: number
          year: number
          amount: number
          status: 'paid' | 'pending'
          payment_date: string | null
          payment_method: 'cash' | 'upi' | 'bank_transfer' | 'other' | null
          transaction_reference: string | null
          created_at: string
        }
        Insert: {
          id?: string
          academy_id: string
          student_id: string
          month: number
          year: number
          amount: number
          status?: 'paid' | 'pending'
          payment_date?: string | null
          payment_method?: 'cash' | 'upi' | 'bank_transfer' | 'other' | null
          transaction_reference?: string | null
          created_at?: string
        }
        Update: {
          amount?: number
          status?: 'paid' | 'pending'
          payment_date?: string | null
          payment_method?: 'cash' | 'upi' | 'bank_transfer' | 'other' | null
          transaction_reference?: string | null
        }
      }
      reminders: {
        Row: {
          id: string
          academy_id: string
          student_id: string
          month: number
          year: number
          amount: number
          message: string | null
          status: 'sent' | 'pending'
          initiated_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          academy_id: string
          student_id: string
          month: number
          year: number
          amount: number
          message?: string | null
          status?: 'sent' | 'pending'
          initiated_at?: string | null
          created_at?: string
        }
        Update: {
          status?: 'sent' | 'pending'
          initiated_at?: string | null
          message?: string | null
        }
      }
      settings: {
        Row: {
          id: string
          academy_id: string
          default_fee: number
          whatsapp_template: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          academy_id: string
          default_fee?: number
          whatsapp_template?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          default_fee?: number
          whatsapp_template?: string
          updated_at?: string
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}
