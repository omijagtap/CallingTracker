import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    const { testEmail } = await req.json();
    
    if (!testEmail) {
      return NextResponse.json({ 
        success: false, 
        error: 'Test email address is required' 
      }, { status: 400 });
    }

    console.log(`🧪 Testing email send to: ${testEmail}`);

    // Try multiple SMTP configurations
    const configs = [
      {
        name: 'Office365 Primary',
        host: 'smtp.office365.com',
        port: 587,
        secure: false,
        auth: {
          user: 'intlesgcidba@upgrad.com',
          pass: 'htmwlfsdhjjmxlls',
        },
        tls: {
          ciphers: 'SSLv3',
          rejectUnauthorized: false
        }
      },
      {
        name: 'Office365 Alternative',
        host: 'smtp-mail.outlook.com',
        port: 587,
        secure: false,
        auth: {
          user: 'intlesgcidba@upgrad.com',
          pass: 'htmwlfsdhjjmxlls',
        },
        tls: {
          rejectUnauthorized: false
        }
      }
    ];

    let lastError = null;

    for (let i = 0; i < configs.length; i++) {
      try {
        console.log(`🔄 Trying ${configs[i].name}...`);
        
        const transporter = nodemailer.createTransport(configs[i]);
        
        // Test connection first
        await transporter.verify();
        console.log(`✅ ${configs[i].name} connection verified!`);
        
        // Send test email
        const mailOptions = {
          from: `"UpGrad Calling Tracker Test" <${configs[i].auth.user}>`,
          to: testEmail,
          subject: '🧪 Test Email from UpGrad Calling Tracker',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #004080;">✅ Email Test Successful!</h2>
              <p>This is a test email from the UpGrad Calling Tracker system.</p>
              <div style="background-color: #f0f8ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3>📧 Email Configuration Details:</h3>
                <ul>
                  <li><strong>SMTP Server:</strong> ${configs[i].host}</li>
                  <li><strong>Port:</strong> ${configs[i].port}</li>
                  <li><strong>Sender:</strong> ${configs[i].auth.user}</li>
                  <li><strong>Configuration:</strong> ${configs[i].name}</li>
                  <li><strong>Test Time:</strong> ${new Date().toLocaleString()}</li>
                </ul>
              </div>
              <p style="color: #666;">If you received this email, the SMTP configuration is working correctly!</p>
              <hr style="margin: 20px 0;">
              <p style="font-size: 12px; color: #999;">
                This is an automated test email from UpGrad Calling Tracker System.
              </p>
            </div>
          `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Test email sent successfully using ${configs[i].name}!`);
        console.log('Message ID:', info.messageId);

        return NextResponse.json({ 
          success: true, 
          message: `Test email sent successfully to ${testEmail} using ${configs[i].name}!`,
          config: configs[i].name,
          messageId: info.messageId
        });

      } catch (configError: any) {
        console.log(`❌ ${configs[i].name} failed:`, configError.message);
        lastError = configError;
        
        if (i === configs.length - 1) {
          // This was the last config, throw the error
          throw configError;
        }
      }
    }

    throw lastError || new Error('All configurations failed');

  } catch (error: any) {
    console.error('❌ Test email error:', error);
    return NextResponse.json({ 
      success: false, 
      error: `Email send failed: ${error.message}. Please check SMTP credentials and network connection.`
    }, { status: 500 });
  }
}
