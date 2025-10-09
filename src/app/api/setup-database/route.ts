import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST() {
  try {
    console.log('🛠️ Setting up Supabase database tables...');
    
    // Since we can't run SQL directly, let's try to create tables by inserting sample data
    // This will help us understand if tables exist
    
    const results = [];
    
    // Test users table
    try {
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      if (error) {
        results.push({ table: 'users', status: 'missing', error: error.message });
      } else {
        results.push({ table: 'users', status: 'exists', count: data?.length || 0 });
      }
    } catch (e: any) {
      results.push({ table: 'users', status: 'error', error: e.message });
    }
    
    // Test activities table
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('count')
        .limit(1);
      
      if (error) {
        results.push({ table: 'activities', status: 'missing', error: error.message });
      } else {
        results.push({ table: 'activities', status: 'exists', count: data?.length || 0 });
      }
    } catch (e: any) {
      results.push({ table: 'activities', status: 'error', error: e.message });
    }
    
    // Test csv_uploads table
    try {
      const { data, error } = await supabase
        .from('csv_uploads')
        .select('count')
        .limit(1);
      
      if (error) {
        results.push({ table: 'csv_uploads', status: 'missing', error: error.message });
      } else {
        results.push({ table: 'csv_uploads', status: 'exists', count: data?.length || 0 });
      }
    } catch (e: any) {
      results.push({ table: 'csv_uploads', status: 'error', error: e.message });
    }
    
    // Test remarks table
    try {
      const { data, error } = await supabase
        .from('remarks')
        .select('count')
        .limit(1);
      
      if (error) {
        results.push({ table: 'remarks', status: 'missing', error: error.message });
      } else {
        results.push({ table: 'remarks', status: 'exists', count: data?.length || 0 });
      }
    } catch (e: any) {
      results.push({ table: 'remarks', status: 'error', error: e.message });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database table check complete',
      tables: results,
      sql: {
        instructions: "Run these SQL commands in your Supabase SQL Editor:",
        users: `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  password TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);`,
        activities: `
CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  activity TEXT NOT NULL,
  details JSONB,
  timestamp TIMESTAMP DEFAULT NOW(),
  date TEXT,
  time TEXT
);`,
        csv_uploads: `
CREATE TABLE IF NOT EXISTS csv_uploads (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT,
  filename TEXT NOT NULL,
  upload_date TIMESTAMP DEFAULT NOW(),
  cohorts TEXT[],
  total_rows INTEGER,
  submitted_count INTEGER,
  not_submitted_count INTEGER
);`,
        remarks: `
CREATE TABLE IF NOT EXISTS remarks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT,
  learner_email TEXT NOT NULL,
  learner_cohort TEXT,
  remark TEXT NOT NULL,
  remark_date TIMESTAMP DEFAULT NOW(),
  csv_filename TEXT
);`
      }
    });

  } catch (e: any) {
    console.error('❌ Database setup error:', e);
    return NextResponse.json({ 
      success: false, 
      error: e.message || 'Unknown error'
    });
  }
}
