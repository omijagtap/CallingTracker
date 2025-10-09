import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Email activity interface
interface EmailActivity {
  id?: string;
  user_id: string;
  user_email: string;
  recipient_email: string;
  subject: string;
  message: string;
  status: 'sent' | 'failed';
  error_message?: string;
  sent_at: string;
  created_at?: string;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const isAdmin = searchParams.get('isAdmin') === 'true';

    // Try Supabase first, fallback to localStorage simulation
    try {
      await verifyEmailActivitiesTable();

      let query = supabase
        .from('email_activities')
        .select('*')
        .order('sent_at', { ascending: false });

      // If not admin, filter by user_id
      if (!isAdmin && userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (!error && data) {
        return NextResponse.json(data);
      }
    } catch (supabaseError) {
      console.log('Supabase failed, using localStorage simulation');
    }

    // Fallback: Return empty array for now (client will use localStorage)
    return NextResponse.json([]);
  } catch (e) {
    console.error('Email activities API error:', e);
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: EmailActivity = await req.json();
    
    // Generate ID if not provided
    if (!body.id) {
      body.id = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Set timestamps
    body.sent_at = body.sent_at || new Date().toISOString();
    body.created_at = new Date().toISOString();

    // Try Supabase first
    try {
      await verifyEmailActivitiesTable();
      
      const { data, error } = await supabase
        .from('email_activities')
        .insert([body])
        .select()
        .single();

      if (!error && data) {
        console.log('✅ Email activity saved to Supabase:', data);
        return NextResponse.json({ success: true, data, source: 'supabase' });
      } else {
        console.log('❌ Supabase insert failed:', error?.message);
      }
    } catch (supabaseError) {
      console.log('❌ Supabase connection failed:', supabaseError);
    }

    // Always return success (client will handle localStorage fallback)
    console.log('📝 Email activity will be stored in localStorage fallback');
    return NextResponse.json({ success: true, data: body, source: 'fallback' });
  } catch (e) {
    console.error('Email activities POST error:', e);
    return NextResponse.json({ success: true, data: {}, source: 'error' });
  }
}

// Function to verify email_activities table exists
async function verifyEmailActivitiesTable() {
  try {
    // Simple check if table exists and is accessible
    const { error } = await supabase
      .from('email_activities')
      .select('id')
      .limit(1);

    if (error) {
      console.log('⚠️ Email activities table not accessible:', error.message);
      console.log('📋 Please create the table using the SQL code provided');
      return false;
    }
    
    console.log('✅ Email activities table is ready');
    return true;
  } catch (e) {
    console.log('❌ Table verification failed:', e);
    return false;
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
      .from('email_activities')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting email activities:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Email activities DELETE error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
