import nodemailer from 'nodemailer';

// Simple email interface
interface SimpleEmail {
  to: string | string[];
  subject: string;
  message: string;
  userId?: string;
}

// SMTP configuration using environment variables for security
const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.office365.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'your_email@upgrad.com',
    pass: process.env.SMTP_PASS || 'your_app_password'
  },
  tls: {
    rejectUnauthorized: false
  },
  connectionTimeout: 60000,
  greetingTimeout: 30000,
  socketTimeout: 60000,
  debug: process.env.NODE_ENV === 'development'
};

// Create simple transporter
function createTransporter() {
  console.log('🔧 Creating transporter with config:', {
    host: SMTP_CONFIG.host,
    port: SMTP_CONFIG.port,
    user: SMTP_CONFIG.auth.user,
    secure: SMTP_CONFIG.secure
  });
  return nodemailer.createTransport(SMTP_CONFIG);
}

// Simple email sending function
export async function sendSimpleEmail(emailData: SimpleEmail): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('📧 Starting email send process...');
    console.log('📧 Recipient:', emailData.to);
    console.log('📧 Subject:', emailData.subject);
    console.log('📧 SMTP Config:', {
      host: SMTP_CONFIG.host,
      port: SMTP_CONFIG.port,
      user: SMTP_CONFIG.auth.user
    });
    
    const transporter = createTransporter();
    console.log('📧 Transporter created successfully');
    
    // Convert message to HTML (make links clickable)
    const htmlMessage = emailData.message
      .replace(/\n/g, '<br>')
      .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
    
    const mailOptions = {
      from: '"UpGrad System" <intlesgcidba@upgrad.com>',
      to: Array.isArray(emailData.to) ? emailData.to.join(', ') : emailData.to,
      subject: emailData.subject,
      text: emailData.message,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
              <h2 style="margin: 0;">📧 ${emailData.subject}</h2>
            </div>
            <div style="background: white; padding: 20px; border: 1px solid #ddd; border-top: none;">
              <div style="margin-bottom: 20px;">
                ${htmlMessage}
              </div>
            </div>
            <div style="background: #f1f3f4; padding: 15px; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #666; font-size: 14px;">
                <strong>Best regards,</strong><br>
                UpGrad Team
              </p>
            </div>
          </div>
        </div>
      `
    };
    const info = await transporter.sendMail(mailOptions);
    
    // Track email activity in dedicated email_activities table
    if (emailData.userId) {
      try {
        const trackingResponse = await fetch('/api/email-activities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            user_id: emailData.userId,
            user_email: emailData.userId === 'admin' ? 'admin@upgrad.com' : emailData.userId,
            recipient_email: Array.isArray(emailData.to) ? emailData.to.join(', ') : emailData.to,
            subject: emailData.subject,
            message: emailData.message,
            status: 'sent',
            sent_at: new Date().toISOString()
          })
        });
        
        if (trackingResponse.ok) {
          console.log('✅ Email activity tracked successfully');
        } else {
          const errorText = await trackingResponse.text();
          console.warn('❌ Failed to track email activity:', errorText);
        }
      } catch (trackingError) {
        console.warn('❌ Failed to track email activity:', trackingError);
        
        // Fallback to localStorage
        try {
          const emailActivity = {
            id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            user_id: emailData.userId,
            user_email: emailData.userId,
            recipient_email: Array.isArray(emailData.to) ? emailData.to.join(', ') : emailData.to,
            subject: emailData.subject,
            message: emailData.message,
            status: 'sent',
            sent_at: new Date().toISOString()
          };
          
          const existingActivities = JSON.parse(localStorage.getItem('email_activities') || '[]');
          existingActivities.push(emailActivity);
          localStorage.setItem('email_activities', JSON.stringify(existingActivities));
          console.log('📝 Email activity saved to localStorage fallback');
        } catch (localError) {
          console.warn('❌ Failed to save to localStorage:', localError);
        }
      }
    }

    console.log('Email sent successfully:', info.messageId);
    
    // Trigger dashboard refresh event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('emailSent'));
    }
    
    return { success: true };

  } catch (error: any) {
    console.error('Email sending failed:', error);
    
    // Track failed email activity
    if (emailData.userId) {
      try {
        const trackingResponse = await fetch('/api/email-activities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: `email_failed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            user_id: emailData.userId,
            user_email: emailData.userId === 'admin' ? 'admin@upgrad.com' : emailData.userId,
            recipient_email: Array.isArray(emailData.to) ? emailData.to.join(', ') : emailData.to,
            subject: emailData.subject,
            message: emailData.message,
            status: 'failed',
            error_message: error.message || 'Unknown error',
            sent_at: new Date().toISOString()
          })
        });
        
        if (trackingResponse.ok) {
          console.log('✅ Failed email activity tracked successfully');
        } else {
          console.warn('❌ Failed to track email failure');
        }
      } catch (trackingError) {
        console.warn('❌ Failed to track email failure:', trackingError);
      }
    }

    return { 
      success: false, 
      error: error.message || 'Failed to send email' 
    };
  }
}

// Test email configuration
export async function testEmailConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('Testing SMTP connection...');
    
    const transporter = createTransporter();
    await transporter.verify();
    
    console.log('SMTP connection successful!');
    return { success: true };
    
  } catch (error: any) {
    console.error('SMTP test failed:', error);
    return {
      success: false,
      error: `Connection failed: ${error.message}`
    };
  }
}

// Alias for backward compatibility
export const testEmailConfiguration = testEmailConnection;

// Email report interface
interface EmailReport {
  cohorts: string[];
  learnerCount: number;
  reportType: 'calling-report';
  data: Array<{
    Email: string;
    Cohort: string;
    Remark: string;
    'Added By': string;
    Date: string;
  }>;
}

interface EmailReportOptions {
  to: string;
  report: EmailReport;
  userInfo: {
    userId: string;
    userName: string;
  };
}

// Send email report function
export async function sendEmailReport(options: EmailReportOptions): Promise<{ success: boolean; error?: string }> {
  try {
    const { to, report, userInfo } = options;
    
    // Generate email content
    const subject = `Calling Report - ${report.cohorts.join(', ')} (${report.learnerCount} learners)`;
    
    let message = `Dear Team,\n\nPlease find the calling report below:\n\n`;
    message += `Cohorts: ${report.cohorts.join(', ')}\n`;
    message += `Total Learners: ${report.learnerCount}\n`;
    message += `Report Type: ${report.reportType}\n\n`;
    
    message += `Report Details:\n`;
    report.data.forEach((item, index) => {
      message += `${index + 1}. ${item.Email} (${item.Cohort})\n`;
      message += `   Remark: ${item.Remark}\n`;
      message += `   Added By: ${item['Added By']} on ${item.Date}\n\n`;
    });
    
    message += `\nBest regards,\n${userInfo.userName}\nUpGrad Calling Tracker System`;
    
    // Send email using the simple email function
    return await sendSimpleEmail({
      to,
      subject,
      message,
      userId: userInfo.userId
    });
    
  } catch (error: any) {
    console.error('Email report sending failed:', error);
    return {
      success: false,
      error: error.message || 'Failed to send email report'
    };
  }
}
