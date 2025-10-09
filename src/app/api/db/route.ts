import { NextResponse } from 'next/server';
import * as models from '@/lib/models';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const searchParams = new URLSearchParams(url.search);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const stats = models.getDashboardStats(userId);
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, data } = body;

    if (!type || !data) {
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }

    let result;

    switch (type) {
      case 'upload':
        result = models.createUploadWithActivity(data.upload, data.activityDetails);
        break;

      case 'activity':
        result = models.createActivity(data);
        break;

      case 'remark':
        result = models.createRemark(data);
        break;

      case 'updateRemark':
        models.updateRemark(data.id, data.remark);
        result = { success: true };
        break;

      default:
        return NextResponse.json({ error: 'Unknown operation type' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error processing database operation:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}