import { NextRequest, NextResponse } from 'next/server';
import { sendSimpleEmail, testEmailConnection } from '@/lib/email-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, ...data } = body;

    if (action === 'test') {
      // Test SMTP connection
      const result = await testEmailConnection();
      return NextResponse.json(result);
    }

    if (action === 'send') {
      // Send simple email
      const { to, subject, message, userId } = data;
      
      if (!to || !subject || !message) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields: to, subject, message' },
          { status: 400 }
        );
      }

      const result = await sendSimpleEmail({ to, subject, message, userId });
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Use "test" or "send"' },
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
  // Test endpoint to check SMTP connection
  try {
    const result = await testEmailConnection();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
