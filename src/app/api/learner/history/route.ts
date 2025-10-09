import { NextRequest, NextResponse } from 'next/server';
import { getLearnerDetails } from '@/lib/tracking-supabase';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const email = searchParams.get('email');
  
  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  try {
    // Since we don't know the cohort in advance, we'll get all details and filter
    const allDetails = await getLearnerDetails() || [];
    const learnerDetails = Array.isArray(allDetails) 
      ? allDetails.find((l: { email: string }) => l.email === email)
      : null;

    if (!learnerDetails) {
      return NextResponse.json(null, { status: 404 });
    }

    return NextResponse.json(learnerDetails);
  } catch (error) {
    console.error('Error fetching learner history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch learner history' },
      { status: 500 }
    );
  }
}