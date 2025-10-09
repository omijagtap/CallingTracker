import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

interface BulkEmailRequest {
  emails: string[];
  subject: string;
  message: string;
  mode: 'personalized' | 'bulk-bcc';
  template?: string;
  csvData?: any[];
}

// Create transporter with working credentials
function createTransporter() {
  const senderEmail = 'intlesgcidba@upgrad.com';
  const appPassword = 'htmwlfsdhjjmxlls';
  
  const config = {
    host: 'smtp.office365.com',
    port: 587,
    secure: false,
    auth: {
      user: senderEmail,
      pass: appPassword,
    },
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 60000,
    greetingTimeout: 30000,
    socketTimeout: 60000
  };
  
  return nodemailer.createTransport(config);
}

// Convert links to HTML (like Python script)
function convertLinksToHtml(text: string): string {
  const urlPattern = /(https?:\/\/\S+)/g;
  return text.replace(urlPattern, '<a href="$1">Link</a>');
}

// Build email message (like Python script)
function buildMessage(emailAddr: string, subject: string, bodyText: string) {
  const htmlBody = convertLinksToHtml(bodyText).replace(/\n/g, '<br>');
  
  return {
    from: '"UpGrad Email System" <intlesgcidba@upgrad.com>',
    to: emailAddr,
    subject: subject,
    text: bodyText, // Plain text fallback
    html: htmlBody  // Rich HTML with clickable links
  };
}

// Replace placeholders in template (like Python script)
function replacePlaceholders(template: string, data: any): string {
  let result = template;
  
  // Find all placeholders in format <Placeholder>
  const placeholders = template.match(/<([^<>]+)>/g);
  
  if (placeholders) {
    placeholders.forEach(placeholder => {
      const key = placeholder.slice(1, -1); // Remove < and >
      const value = data[key] || '';
      result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
    });
  }
  
  return result;
}

export async function POST(req: NextRequest) {
  try {
    const body: BulkEmailRequest = await req.json();
    const { emails, subject, message, mode, template, csvData } = body;

    if (!emails || emails.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No email addresses provided' },
        { status: 400 }
      );
    }

    if (!subject || !message) {
      return NextResponse.json(
        { success: false, error: 'Subject and message are required' },
        { status: 400 }
      );
    }

    console.log(`Starting bulk email send: ${mode} mode, ${emails.length} recipients`);

    const transporter = createTransporter();
    const statusList: Array<{ email: string; status: string }> = [];

    if (mode === 'personalized' && template && csvData) {
      // Personalized emails (like Python script mode 1)
      console.log('Sending personalized emails...');
      
      for (let i = 0; i < emails.length; i++) {
        const email = emails[i];
        const learnerData = csvData[i] || {};
        
        try {
          // Replace placeholders in template with learner data
          const personalizedMessage = replacePlaceholders(template, learnerData);
          const mailOptions = buildMessage(email, subject, personalizedMessage);
          
          await transporter.sendMail(mailOptions);
          console.log(`✅ Sent to ${email}`);
          statusList.push({ email, status: 'Sent' });
          
          // Add delay between emails (like Python script)
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error: any) {
          console.log(`❌ Failed for ${email}:`, error.message);
          statusList.push({ email, status: `Failed (${error.message})` });
        }
      }
    } else {
      // Bulk BCC emails (like Python script mode 2)
      console.log('Sending bulk BCC email...');
      
      try {
        const mailOptions = {
          from: '"UpGrad Email System" <intlesgcidba@upgrad.com>',
          to: 'intlesgcidba@upgrad.com', // Send to self
          bcc: emails, // All recipients in BCC
          subject: subject,
          text: message,
          html: convertLinksToHtml(message).replace(/\n/g, '<br>')
        };
        
        await transporter.sendMail(mailOptions);
        console.log(`✅ Bulk email sent to ${emails.length} recipients`);
        
        // Mark all as sent
        emails.forEach(email => {
          statusList.push({ email, status: 'Sent' });
        });
        
      } catch (error: any) {
        console.log(`❌ Bulk BCC failed:`, error.message);
        
        // Mark all as failed
        emails.forEach(email => {
          statusList.push({ email, status: `Failed (${error.message})` });
        });
      }
    }

    await transporter.close();

    // Generate report (like Python script)
    const sentCount = statusList.filter(s => s.status === 'Sent').length;
    const failedCount = statusList.filter(s => s.status.startsWith('Failed')).length;

    console.log('\n--- EMAIL SUMMARY ---');
    console.log(`Total emails: ${emails.length}`);
    console.log(`✅ Sent: ${sentCount}`);
    console.log(`❌ Failed: ${failedCount}`);

    return NextResponse.json({
      success: true,
      summary: {
        total: emails.length,
        sent: sentCount,
        failed: failedCount,
        mode: mode
      },
      details: statusList
    });

  } catch (error: any) {
    console.error('Bulk email API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Test endpoint
export async function GET() {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    await transporter.close();
    
    return NextResponse.json({
      success: true,
      message: 'Bulk email service is ready!',
      config: {
        host: 'smtp.office365.com',
        port: 587,
        user: 'intlesgcidba@upgrad.com'
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
