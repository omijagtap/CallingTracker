import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    let body;
    try {
      body = await req.json();
    } catch (jsonError) {
      console.log('Invalid JSON in request body:', jsonError);
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { userId, isOnline, lastSeen, isActive } = body || {};

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Enhanced activity tracking with proper online/offline status
    try {
      
      if (isOnline && isActive !== false) {
        // Create an activity record to show user is actively online
        await supabase
          .from('activities')
          .insert([{
            id: `online_${userId}_${Date.now()}`,
            user_id: userId,
            activity: 'User Active',
            details: {
              status: 'active',
              timestamp: lastSeen,
              userAgent: 'Browser',
              isActive: isActive
            }
          }]);
        
        console.log(`User ${userId} marked as actively online`);
      } else {
        // Create offline activity record
        await supabase
          .from('activities')
          .insert([{
            id: `offline_${userId}_${Date.now()}`,
            user_id: userId,
            activity: 'User Offline',
            details: {
              status: 'offline',
              timestamp: lastSeen,
              reason: isActive === false ? 'inactive' : 'left_page'
            }
          }]);
        
        console.log(`User ${userId} marked as offline`);
      }
    } catch (error) {
      console.log('Failed to create activity record:', error);
      // Don't fail the request if activity creation fails
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Online status API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const adminRequest = searchParams.get('admin') === 'true';

    if (!adminRequest) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Since Supabase doesn't have online status columns, we'll simulate online users
    // by getting recent activity from users who have been active in the last 5 minutes
    try {
      // Get all users first
      const { data: allUsers } = await supabase
        .from('users')
        .select('id, name, email');

      if (!allUsers) {
        return NextResponse.json({ onlineUsers: [] });
      }

      // Get recent activities to determine who's truly online
      const { data: recentActivities } = await supabase
        .from('activities')
        .select('user_id, activity, created_at, details')
        .gte('created_at', new Date(Date.now() - 3 * 60 * 1000).toISOString()) // Last 3 minutes for more responsive detection
        .order('created_at', { ascending: false });

      console.log('Recent activities found:', recentActivities?.length || 0);

      // Create a map to track the most recent activity for each user
      const userLastActivity = new Map();
      
      // Process activities to find the most recent status for each user
      (recentActivities || []).forEach((activity: any) => {
        const userId = activity.user_id;
        const activityTime = new Date(activity.created_at).getTime();
        
        if (!userLastActivity.has(userId) || userLastActivity.get(userId).time < activityTime) {
          userLastActivity.set(userId, {
            activity: activity.activity,
            time: activityTime,
            timestamp: activity.created_at
          });
        }
      });

      // Create a set of currently online user IDs
      const activeUserIds = new Set();
      
      // Add users whose most recent activity was "User Active"
      userLastActivity.forEach((lastActivity, userId) => {
        if (lastActivity.activity === 'User Active') {
          activeUserIds.add(userId);
          console.log('Found active user:', userId, 'last activity:', lastActivity.activity);
        } else {
          console.log('User offline:', userId, 'last activity:', lastActivity.activity);
        }
      });

      // Always add admin as online when they're viewing the dashboard
      activeUserIds.add('admin');
      console.log('Active user IDs after adding admin:', Array.from(activeUserIds));

      // Create online users list
      const onlineUsers: Array<{
        id: string;
        name: string;
        email: string;
        is_online: boolean;
        last_seen: string;
      }> = [];
      
      // Add users from database who are active
      allUsers.forEach(user => {
        if (activeUserIds.has(user.id)) {
          onlineUsers.push({
            id: user.id,
            name: user.name || user.email || `User ${user.id}`,
            email: user.email,
            is_online: true,
            last_seen: new Date().toISOString()
          });
        }
      });

      // Always ensure admin is included (even if not in database users)
      if (activeUserIds.has('admin') && !onlineUsers.find(u => u.id === 'admin')) {
        onlineUsers.push({
          id: 'admin',
          name: 'Admin',
          email: 'admin@upgrad.com',
          is_online: true,
          last_seen: new Date().toISOString()
        });
      }

      // Add any other active users not found in database
      activeUserIds.forEach(userId => {
        const userIdStr = String(userId);
        if (!onlineUsers.find(u => u.id === userIdStr)) {
          onlineUsers.push({
            id: userIdStr,
            name: userIdStr === 'admin' ? 'Admin' : `User ${userIdStr}`,
            email: userIdStr === 'admin' ? 'admin@upgrad.com' : `${userIdStr}@system.local`,
            is_online: true,
            last_seen: new Date().toISOString()
          });
        }
      });

      console.log('Online users found:', onlineUsers.length, 'Active user IDs:', Array.from(activeUserIds));
      console.log('Final online users:', onlineUsers);
      
      return NextResponse.json({ onlineUsers });
    } catch (error) {
      console.error('Error getting online users:', error);
      
      // Fallback: return at least the admin as online
      return NextResponse.json({ 
        onlineUsers: [{
          id: 'admin',
          name: 'Admin',
          email: 'admin@upgrad.com',
          is_online: true,
          last_seen: new Date().toISOString()
        }]
      });
    }
  } catch (error) {
    console.error('Get online users API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
