import { NextRequest, NextResponse } from 'next/server';
import { testEmailConfiguration, sendEmailReport } from '@/lib/email-service';

export async function GET() {
  try {
    console.log('Testing SMTP configuration...');
    const result = await testEmailConfiguration();
    
    if (result.success) {
      console.log('✅ SMTP test successful!');
      return NextResponse.json({ 
        success: true, 
        message: 'SMTP configuration is working correctly!',
        config: {
          host: 'smtp.office365.com',
          port: 587,
          user: 'intlesgcidba@upgrad.com'
        }
      });
    } else {
      console.log('❌ SMTP test failed:', result.error);
      return NextResponse.json({ 
        success: false, 
        error: result.error 
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('❌ SMTP test error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { testEmail } = await req.json();
    
    if (!testEmail) {
      return NextResponse.json({ 
        success: false, 
        error: 'Test email address is required' 
      }, { status: 400 });
    }

    console.log(`Sending test email to: ${testEmail}`);

    // Send a test email
    const testReport = {
      cohorts: ['TEST-COHORT-001'],
      learnerCount: 1,
      reportType: 'calling-report' as const,
      data: [{
        'Email': 'test.learner@example.com',
        'Cohort': 'TEST-COHORT-001',
        'Remark': 'This is a test email from upGrad Calling Tracker system.',
        'Added By': 'Admin',
        'Date': new Date().toLocaleDateString()
      }]
    };

    const result = await sendEmailReport({
      to: testEmail,
      report: testReport,
      userInfo: {
        userId: 'admin',
        userName: 'Admin Test'
      }
    });

    // Track email activity
    try {
      await fetch('http://localhost:3000/api/email-activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'admin',
          user_email: 'admin@upgrad.com',
          recipient_email: testEmail,
          subject: 'Test Email from UpGrad Calling Tracker',
          message: 'This is a test email to verify SMTP configuration.',
          status: result.success ? 'sent' : 'failed',
          error_message: result.success ? undefined : result.error,
          sent_at: new Date().toISOString()
        })
      });
      console.log('✅ Test email activity tracked');
    } catch (trackingError) {
      console.warn('❌ Failed to track test email activity:', trackingError);
    }

    if (result.success) {
      console.log('✅ Test email sent successfully!');
      return NextResponse.json({ 
        success: true, 
        message: `Test email sent successfully to ${testEmail}!` 
      });
    } else {
      console.log('❌ Test email failed:', result.error);
      return NextResponse.json({ 
        success: false, 
        error: result.error 
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('❌ Test email error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
