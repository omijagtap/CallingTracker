import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const isAdmin = searchParams.get('admin') === 'true';

    if (isAdmin) {
      // Get all badges for admin view
      const { data, error } = await supabase
        .from('user_badges')
        .select('*')
        .neq('user_id', 'system')
        .order('awarded_date', { ascending: false });

      if (error) {
        console.error('Error fetching admin badges:', error);
        return NextResponse.json({ error: 'Failed to fetch badges' }, { status: 500 });
      }

      return NextResponse.json({ badges: data || [] });
    }

    if (userId) {
      // Get badges for specific user
      const { data, error } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('awarded_date', { ascending: false });

      if (error) {
        console.error('Error fetching user badges:', error);
        return NextResponse.json({ error: 'Failed to fetch user badges' }, { status: 500 });
      }

      return NextResponse.json({ badges: data || [] });
    }

    // Get badge templates for awarding
    const { data, error } = await supabase
      .from('user_badges')
      .select('badge_type, badge_name, badge_description, badge_icon, badge_color')
      .eq('user_id', 'system')
      .order('badge_name');

    if (error) {
      console.error('Error fetching badge templates:', error);
      return NextResponse.json({ error: 'Failed to fetch badge templates' }, { status: 500 });
    }

    return NextResponse.json({ badgeTemplates: data || [] });
  } catch (error) {
    console.error('Badges GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, badgeType, badgeName, badgeDescription, badgeIcon, badgeColor, awardedBy, performanceReason } = body;

    if (!userId || !badgeType || !badgeName || !awardedBy) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Award badge to user
    const { data, error } = await supabase
      .from('user_badges')
      .insert([{
        user_id: userId,
        badge_type: badgeType,
        badge_name: badgeName,
        badge_description: badgeDescription || '',
        badge_icon: badgeIcon || '🏆',
        badge_color: badgeColor || '#3B82F6',
        awarded_by: awardedBy,
        performance_reason: performanceReason || '',
        is_active: true
      }])
      .select()
      .single();

    if (error) {
      console.error('Error awarding badge:', error);
      return NextResponse.json({ error: 'Failed to award badge' }, { status: 500 });
    }

    return NextResponse.json({ success: true, badge: data });
  } catch (error) {
    console.error('Badges POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const badgeId = searchParams.get('badgeId');

    if (!badgeId) {
      return NextResponse.json({ error: 'Badge ID is required' }, { status: 400 });
    }

    // Deactivate badge instead of deleting
    const { error } = await supabase
      .from('user_badges')
      .update({ is_active: false })
      .eq('id', badgeId);

    if (error) {
      console.error('Error removing badge:', error);
      return NextResponse.json({ error: 'Failed to remove badge' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Badges DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
