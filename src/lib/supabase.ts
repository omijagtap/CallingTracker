import { createClient } from '@supabase/supabase-js'

// Real Supabase credentials - your actual database
const supabaseUrl = 'https://mkmuhctmddhttosgcpmo.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rbXVoY3RtZGRodHRvc2djcG1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2Nzc5NDYsImV4cCI6MjA3NTI1Mzk0Nn0.74MVBKm0s760KPj3Msr-vLTRzRZSx9Q0ni5pig9G-6M'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface User {
  id: string
  email: string
  name?: string
  password?: string
  created_at?: string
  updated_at?: string
}

export interface Activity {
  id: string
  user_id: string
  activity: string
  details?: any
  timestamp: string
  date?: string
  time?: string
  created_at?: string
}

export interface CSVUpload {
  id: string
  user_id: string
  user_name: string
  filename: string
  upload_date: string
  cohorts?: string[]
  total_rows?: number
  submitted_count?: number
  not_submitted_count?: number
  created_at?: string
}

export interface Remark {
  id: string
  user_id: string
  user_name: string
  learner_email: string
  learner_cohort: string
  remark: string
  remark_date: string
  csv_filename?: string
  created_at?: string
}

export interface LearnerDetail {
  id?: number
  email: string
  cohort: string
  submission_status?: string
  learner_type?: string
  last_remark?: {
    remark: string
    date: string
    by: string
  }
  history?: Array<{
    date: string
    action: string
    details: string
    by: string
  }>
  created_at?: string
  updated_at?: string
}

export interface UserProfile {
  id?: string
  user_id: string
  name?: string
  email?: string
  bio?: string
  location?: string
  phone?: string
  reporting_manager?: string
  reporting_manager_email?: string
  created_at?: string
  updated_at?: string
}
