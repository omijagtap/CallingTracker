import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST() {
  try {
    console.log('🔧 Creating email_activities table...');
    
    // Create the email_activities table using direct SQL execution
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS email_activities (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        user_email TEXT NOT NULL,
        recipient_email TEXT NOT NULL,
        subject TEXT NOT NULL,
        message TEXT,
        status TEXT NOT NULL DEFAULT 'sent',
        error_message TEXT,
        sent_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    const createIndexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_email_activities_user_id ON email_activities(user_id);
      CREATE INDEX IF NOT EXISTS idx_email_activities_sent_at ON email_activities(sent_at);
      CREATE INDEX IF NOT EXISTS idx_email_activities_status ON email_activities(status);
      CREATE INDEX IF NOT EXISTS idx_email_activities_recipient ON email_activities(recipient_email);
    `;

    // Execute table creation
    const { error: tableError } = await supabase.rpc('exec', { sql: createTableSQL });
    if (tableError) {
      console.error('❌ Error creating table:', tableError);
      return NextResponse.json({ 
        success: false, 
        error: `Table creation failed: ${tableError.message}` 
      }, { status: 500 });
    }

    // Execute index creation
    const { error: indexError } = await supabase.rpc('exec', { sql: createIndexesSQL });
    if (indexError) {
      console.warn('⚠️ Warning creating indexes:', indexError);
      // Continue even if indexes fail
    }


    console.log('✅ Email activities table created successfully!');
    
    // Test the table by inserting a sample record
    const testRecord = {
      id: `test_${Date.now()}`,
      user_id: 'admin',
      user_email: 'admin@upgrad.com',
      recipient_email: 'test@example.com',
      subject: 'Test Email Setup',
      message: 'This is a test email to verify table creation.',
      status: 'sent',
      sent_at: new Date().toISOString()
    };

    const { error: insertError } = await supabase
      .from('email_activities')
      .insert([testRecord]);

    if (insertError) {
      console.error('❌ Error inserting test record:', insertError);
      return NextResponse.json({ 
        success: false, 
        error: `Table created but test insert failed: ${insertError.message}` 
      }, { status: 500 });
    }

    console.log('✅ Test record inserted successfully!');

    return NextResponse.json({ 
      success: true, 
      message: 'Email activities table created and tested successfully!' 
    });

  } catch (error: any) {
    console.error('❌ Setup error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Check if table exists and get sample data
    const { data, error } = await supabase
      .from('email_activities')
      .select('*')
      .limit(5);

    if (error) {
      return NextResponse.json({ 
        exists: false, 
        error: error.message 
      });
    }

    return NextResponse.json({ 
      exists: true, 
      recordCount: data?.length || 0,
      sampleData: data 
    });

  } catch (error: any) {
    return NextResponse.json({ 
      exists: false, 
      error: error.message 
    });
  }
}
