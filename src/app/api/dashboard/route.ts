import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

const DB_DIR = path.join(process.cwd(), 'data');
const DASHBOARD_FILE = path.join(DB_DIR, 'dashboard.json');

interface DashboardData {
  globalStats: {
    totalUsers: number;
    totalUploads: number;
    totalRemarks: number;
  };
  recentActivity: Array<{
    id: string;
    userId: string;
    activity: string;
    details: any;
    timestamp: string;
    userName: string;
  }>;
  userStats: Array<{
    userId: string;
    name: string;
    email: string;
    uploadsCount: number;
    remarksCount: number;
    lastActive: string;
  }>;
}

// Initialize DB file if it doesn't exist
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}
if (!fs.existsSync(DASHBOARD_FILE)) {
  fs.writeFileSync(DASHBOARD_FILE, JSON.stringify({
    globalStats: { totalUsers: 0, totalUploads: 0, totalRemarks: 0 },
    recentActivity: [],
    userStats: []
  }, null, 2));
}

export async function GET() {
  try {
    const data = fs.readFileSync(DASHBOARD_FILE, 'utf-8');
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    console.error('Error reading dashboard data:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const update = await req.json();
    const currentData: DashboardData = JSON.parse(fs.readFileSync(DASHBOARD_FILE, 'utf-8'));
    
    // Update global stats
    if (update.globalStats) {
      currentData.globalStats = {
        ...currentData.globalStats,
        ...update.globalStats
      };
    }

    // Add new activity
    if (update.activity) {
      currentData.recentActivity.unshift(update.activity);
      currentData.recentActivity = currentData.recentActivity.slice(0, 50); // Keep last 50 activities
    }

    // Update user stats
    if (update.userStat) {
      const userIndex = currentData.userStats.findIndex(u => u.userId === update.userStat.userId);
      if (userIndex >= 0) {
        currentData.userStats[userIndex] = {
          ...currentData.userStats[userIndex],
          ...update.userStat
        };
      } else {
        currentData.userStats.push(update.userStat);
      }
    }

    fs.writeFileSync(DASHBOARD_FILE, JSON.stringify(currentData, null, 2));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating dashboard data:', error);
    return NextResponse.json({ error: 'Failed to update dashboard data' }, { status: 500 });
  }
}