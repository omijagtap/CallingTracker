import { NextRequest, NextResponse } from 'next/server';
import { sendEmailReport, testEmailConfiguration } from '@/lib/email-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, ...data } = body;

    if (action === 'test') {
      // Test SMTP configuration
      const result = await testEmailConfiguration();
      return NextResponse.json(result);
    }

    if (action === 'send') {
      // Send email report
      const { to, report, userInfo } = data;
      
      if (!to || !report || !userInfo) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400 }
        );
      }

      const result = await sendEmailReport({ to, report, userInfo });
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Email API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Test endpoint to check SMTP configuration
  try {
    const result = await testEmailConfiguration();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
