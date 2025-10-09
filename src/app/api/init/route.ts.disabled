import { NextResponse } from 'next/server';
import { initializeData, checkSupabaseConnection } from '@/lib/init-data';

export async function POST() {
  try {
    // Check if Supabase is available
    const isSupabaseAvailable = await checkSupabaseConnection();
    
    if (!isSupabaseAvailable) {
      return NextResponse.json({ 
        success: false, 
        message: 'Supabase not available - using localStorage fallback' 
      });
    }

    // Initialize sample data
    const result = await initializeData();
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Init API error:', error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Initialization failed' 
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Just check connection status
    const isSupabaseAvailable = await checkSupabaseConnection();
    
    return NextResponse.json({ 
      success: true, 
      supabaseAvailable: isSupabaseAvailable,
      message: isSupabaseAvailable ? 'Supabase connected' : 'Using localStorage fallback'
    });

  } catch (error: any) {
    console.error('Init status error:', error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Status check failed' 
    }, { status: 500 });
  }
}
