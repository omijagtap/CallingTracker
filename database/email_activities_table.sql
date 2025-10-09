-- Create email_activities table for tracking email sending
CREATE TABLE IF NOT EXISTS email_activities (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  recipient_email VARCHAR(255) NOT NULL,
  subject TEXT NOT NULL,
  message TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'sent', -- 'sent' or 'failed'
  error_message TEXT,
  sent_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_activities_user_id ON email_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_email_activities_sent_at ON email_activities(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_activities_status ON email_activities(status);
CREATE INDEX IF NOT EXISTS idx_email_activities_recipient ON email_activities(recipient_email);

-- Insert sample data for testing (optional)
-- INSERT INTO email_activities (id, user_id, user_email, recipient_email, subject, message, status, sent_at) VALUES
-- ('email_test_1', 'admin', 'admin@upgrad.com', 'test@example.com', 'Test Email', 'This is a test email', 'sent', NOW()),
-- ('email_test_2', '1759688040100', 'user@example.com', 'learner@example.com', 'Follow-up Email', 'Follow-up message', 'sent', NOW());
