-- Run this SQL directly in your Supabase SQL Editor
-- This will create the email_activities table for tracking emails

-- Create email_activities table
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_activities_user_id ON email_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_email_activities_sent_at ON email_activities(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_activities_status ON email_activities(status);
CREATE INDEX IF NOT EXISTS idx_email_activities_recipient ON email_activities(recipient_email);

-- Insert a test record to verify the table works
INSERT INTO email_activities (
  id, 
  user_id, 
  user_email, 
  recipient_email, 
  subject, 
  message, 
  status, 
  sent_at
) VALUES (
  'test_setup_' || extract(epoch from now()),
  'admin',
  'admin@upgrad.com',
  'test@example.com',
  'Email Table Setup Test',
  'This is a test email to verify the email_activities table is working correctly.',
  'sent',
  NOW()
);

-- Verify the table was created and test record inserted
SELECT 
  'Email table created successfully!' as message,
  COUNT(*) as test_records_count
FROM email_activities 
WHERE id LIKE 'test_setup_%';
