// Quick setup script for email table
// Run this with: node setup-email-table.js

const { createClient } = require('@supabase/supabase-js');

// Your Supabase credentials
const supabaseUrl = 'https://mkmuhctmddhttosgcpmo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rbXVoY3RtZGRodHRvc2djcG1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM3MzE4NzQsImV4cCI6MjA0OTMwNzg3NH0.YOJhNTcOlxKGJCGKJmxvJgJhJGJCGKJCGKJCGKJCGK'; // Replace with your actual key

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupEmailTable() {
  try {
    console.log('🔧 Setting up email_activities table...');
    
    // Create the table
    const { error } = await supabase.rpc('exec', {
      sql: `
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
        
        CREATE INDEX IF NOT EXISTS idx_email_activities_user_id ON email_activities(user_id);
        CREATE INDEX IF NOT EXISTS idx_email_activities_sent_at ON email_activities(sent_at);
        CREATE INDEX IF NOT EXISTS idx_email_activities_status ON email_activities(status);
      `
    });

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    // Insert test record
    const { error: insertError } = await supabase
      .from('email_activities')
      .insert([{
        id: `setup_test_${Date.now()}`,
        user_id: 'admin',
        user_email: 'admin@upgrad.com',
        recipient_email: 'test@example.com',
        subject: 'Setup Test Email',
        message: 'This is a test email to verify the table setup.',
        status: 'sent',
        sent_at: new Date().toISOString()
      }]);

    if (insertError) {
      console.error('❌ Insert Error:', insertError);
      return;
    }

    console.log('✅ Email activities table setup completed!');
    console.log('✅ Test record inserted successfully!');
    console.log('🎉 Your email tracking is now ready!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

setupEmailTable();
