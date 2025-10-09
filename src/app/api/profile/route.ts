import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get user profile from Supabase
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching profile:', error);
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }

    // If no profile exists, return empty profile
    if (!data) {
      return NextResponse.json({
        user_id: userId,
        name: '',
        email: '',
        bio: '',
        location: '',
        phone: '',
        reportingManager: '',
        reportingManagerEmail: ''
      });
    }

    return NextResponse.json({
      user_id: data.user_id,
      name: data.name || '',
      email: data.email || '',
      bio: data.bio || '',
      location: data.location || '',
      phone: data.phone || '',
      reportingManager: data.reporting_manager || '',
      reportingManagerEmail: data.reporting_manager_email || '',
      created_at: data.created_at,
      updated_at: data.updated_at
    });
  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      userId, 
      name, 
      email, 
      bio, 
      location, 
      phone, 
      reportingManager, 
      reportingManagerEmail 
    } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const profileData = {
      user_id: userId,
      name: name || '',
      email: email || '',
      bio: bio || '',
      location: location || '',
      phone: phone || '',
      reporting_manager: reportingManager || '',
      reporting_manager_email: reportingManagerEmail || '',
      updated_at: new Date().toISOString()
    };

    // Try to update existing profile first
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('user_id', userId)
      .single();

    if (existingProfile) {
      // Update existing profile
      const { data, error } = await supabase
        .from('user_profiles')
        .update(profileData)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
      }

      return NextResponse.json({ success: true, data });
    } else {
      // Create new profile
      const { data, error } = await supabase
        .from('user_profiles')
        .insert([{
          ...profileData,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
      }

      return NextResponse.json({ success: true, data });
    }
  } catch (error) {
    console.error('Profile POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
