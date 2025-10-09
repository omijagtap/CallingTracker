import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('🔍 Testing Supabase connection...');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Supabase connection failed:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        hint: error.hint,
        details: error.details,
        message: 'Supabase connection failed - tables may not exist or API key is invalid'
      });
    }

    console.log('✅ Supabase connection successful!');
    return NextResponse.json({ 
      success: true, 
      message: 'Supabase is working correctly!',
      data: data
    });

  } catch (e: any) {
    console.error('❌ Unexpected Supabase error:', e);
    return NextResponse.json({ 
      success: false, 
      error: e.message || 'Unknown error',
      message: 'Failed to connect to Supabase'
    });
  }
}

export async function POST() {
  try {
    console.log('🛠️ Creating Supabase tables...');
    
    // Create users table
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        password TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;

    // Create activities table  
    const createActivitiesTable = `
      CREATE TABLE IF NOT EXISTS activities (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        activity TEXT NOT NULL,
        details JSONB,
        timestamp TIMESTAMP DEFAULT NOW(),
        date TEXT,
        time TEXT
      );
    `;

    // Create csv_uploads table
    const createUploadsTable = `
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
      );
    `;

    // Create remarks table
    const createRemarksTable = `
      CREATE TABLE IF NOT EXISTS remarks (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        user_name TEXT,
        learner_email TEXT NOT NULL,
        learner_cohort TEXT,
        remark TEXT NOT NULL,
        remark_date TIMESTAMP DEFAULT NOW(),
        csv_filename TEXT
      );
    `;

    console.log('📋 SQL tables creation attempted');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Table creation SQL generated - you need to run this in Supabase dashboard',
      sql: {
        users: createUsersTable,
        activities: createActivitiesTable,
        uploads: createUploadsTable,
        remarks: createRemarksTable
      }
    });

  } catch (e: any) {
    console.error('❌ Table creation error:', e);
    return NextResponse.json({ 
      success: false, 
      error: e.message || 'Unknown error'
    });
  }
}
