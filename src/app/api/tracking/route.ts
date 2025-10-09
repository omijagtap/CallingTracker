import { NextRequest, NextResponse } from 'next/server';
import { getCSVUploads, getRemarks, getLearnerDetails, trackCSVUpload, trackRemark, getTrackingData, deleteRemark } from '@/lib/tracking-supabase';
 
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || '';
    const isAdmin = searchParams.get('admin') === 'true';

    const response = await getTrackingData(userId || undefined, isAdmin);
    return NextResponse.json(response);
  } catch (e) {
    console.error('Tracking GET error:', e);
    // Return empty tracking data instead of error to prevent crashes
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || '';
    const fallbackResponse = {
      userId: userId || null,
      totals: {
        uploads: 0,
        remarks: 0,
        learnersTracked: 0,
      },
      recent: {
        uploads: [],
        remarks: [],
      },
      remarksByCohort: {},
    };
    return NextResponse.json(fallbackResponse);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const remarkId = searchParams.get('remarkId');
    if (!remarkId) {
      return NextResponse.json({ error: 'remarkId is required' }, { status: 400 });
    }

    await deleteRemark(remarkId);
    return NextResponse.json({ success: true, removed: 1 });
  } catch (e) {
    console.error('Tracking DELETE error:', e);
    return NextResponse.json({ error: 'Failed to delete remark' }, { status: 500 });
  }
}
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, data } = body || {};
    if (!type || !data) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    
    if (type === 'upload') {
      // Try Supabase first
      try {
        await trackCSVUpload({
          user_id: data.userId,
          user_name: data.userName,
          filename: data.filename,
          cohorts: data.cohorts || [],
          total_rows: Number(data.totalRows || 0),
          submitted_count: Number(data.submittedCount || 0),
          not_submitted_count: Number(data.notSubmittedCount || 0),
        });
        console.log('Upload tracked in Supabase');
        return NextResponse.json({ success: true, source: 'supabase' });
      } catch (supabaseError) {
        console.error('Supabase upload tracking failed:', supabaseError);
        // Return success anyway, frontend will handle localStorage
        return NextResponse.json({ success: true, source: 'fallback' });
      }
    }
    
    if (type === 'remark') {
      // Try Supabase first
      try {
        await trackRemark({
          user_id: data.userId,
          user_name: data.userName,
          learner_email: data.learnerEmail,
          learner_cohort: data.learnerCohort,
          remark: data.remark,
          csv_filename: data.csvFilename || ''
        });
        console.log('Remark tracked in Supabase');
        return NextResponse.json({ success: true, source: 'supabase' });
      } catch (supabaseError) {
        console.error('Supabase remark tracking failed:', supabaseError);
        // Return success anyway, frontend will handle localStorage
        return NextResponse.json({ success: true, source: 'fallback' });
      }
    }
    
    return NextResponse.json({ error: 'Unknown type' }, { status: 400 });
  } catch (e) {
    console.error('Tracking POST error:', e);
    // Return success to prevent frontend errors
    return NextResponse.json({ success: true, source: 'error' });
  }
}
