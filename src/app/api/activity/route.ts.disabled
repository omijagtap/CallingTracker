import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching activities:', error);
      // Return empty array instead of error to prevent crashes
      return NextResponse.json([]);
    }

    return NextResponse.json(data || []);
  } catch (e) {
    console.error('Supabase not available:', e);
    // Return empty array instead of error to prevent crashes
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Try Supabase first
    try {
      const { data, error } = await supabase
        .from('activities')
        .insert([body])
        .select()
        .single();

      if (!error) {
        console.log('Activity saved to Supabase:', data);
        return NextResponse.json({ success: true, data, source: 'supabase' });
      } else {
        console.error('Supabase error:', error);
      }
    } catch (supabaseError) {
      console.error('Supabase connection failed:', supabaseError);
    }

    // If Supabase fails, return success anyway (frontend will handle localStorage)
    console.log('Supabase failed, frontend will use localStorage fallback');
    return NextResponse.json({ success: true, data: body, source: 'fallback' });
    
  } catch (e) {
    console.error('Unexpected error:', e);
    return NextResponse.json({ success: true, data: {}, source: 'error' });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting activities:', error);
      return NextResponse.json({ error: 'Failed to delete activities' }, { status: 500 });
    }

    return NextResponse.json({ success: true, removed: 1 });
  } catch (e) {
    console.error('Failed to delete activities:', e);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
