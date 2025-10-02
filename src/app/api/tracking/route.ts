import { NextRequest, NextResponse } from 'next/server';
import { getCSVUploads, getRemarks, getLearnerDetails, trackCSVUpload, trackRemark } from '@/lib/tracking';
 
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || '';
    const isAdmin = searchParams.get('admin') === 'true';

    const uploads = getCSVUploads(userId || undefined);
    const remarks = getRemarks(userId || undefined);
    const learners = getLearnerDetails();
    const learnersArr = Array.isArray(learners) ? learners : (learners ? [learners] : []);

    const remarksByCohort = remarks.reduce((acc: Record<string, number>, r: any) => {
      const key = (r.learnerCohort || 'Unknown').toString();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Enhanced data for admin dashboard
    let adminData = {};
    if (isAdmin) {
      // Get all uploads and remarks for admin view
      const allUploads = getCSVUploads();
      const allRemarks = getRemarks();
      const allLearners = getLearnerDetails();
      const allLearnersArr = Array.isArray(allLearners) ? allLearners : (allLearners ? [allLearners] : []);

      // Calculate cohort distribution from all data
      const allCohortData = allRemarks.reduce((acc: Record<string, number>, r: any) => {
        const key = (r.learnerCohort || 'Unknown').toString();
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Activity timeline data (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentUploads = allUploads.filter(u => 
        new Date(u.uploadDate) >= thirtyDaysAgo
      );
      const recentRemarks = allRemarks.filter(r => 
        new Date(r.remarkDate) >= thirtyDaysAgo
      );

      adminData = {
        globalStats: {
          totalUploads: allUploads.length,
          totalRemarks: allRemarks.length,
          totalLearners: allLearnersArr.length,
          activeUsers: new Set([...allUploads.map(u => u.userId), ...allRemarks.map(r => r.userId)]).size
        },
        cohortDistribution: allCohortData,
        recentActivity: {
          uploads: recentUploads.slice(0, 20),
          remarks: recentRemarks.slice(0, 20)
        },
        timeline: {
          uploads: allUploads.slice(0, 50),
          remarks: allRemarks.slice(0, 50)
        }
      };
    }

    const response = {
      userId: userId || null,
      totals: {
        uploads: uploads.length,
        remarks: remarks.length,
        learnersTracked: learnersArr.length,
      },
      recent: {
        uploads: uploads.slice(0, 5),
        remarks: remarks.slice(0, 5),
      },
      remarksByCohort,
      ...adminData
    };

    return NextResponse.json(response);
  } catch (e) {
    console.error('Tracking GET error:', e);
    return NextResponse.json({ error: 'Failed to read tracking data' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const remarkId = searchParams.get('remarkId');
    if (!remarkId) {
      return NextResponse.json({ error: 'remarkId is required' }, { status: 400 });
    }
    // Lazy import to avoid server bundling issues
    const { default: fs } = await import('fs');
    const { default: path } = await import('path');
    const filePath = path.join(process.cwd(), 'data', 'tracking.json');
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ success: true, removed: 0 });
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw || '{}');
    const before = Array.isArray(data.remarks) ? data.remarks.length : 0;
    data.remarks = (Array.isArray(data.remarks) ? data.remarks : []).filter((r: any) => r.id !== remarkId);
    const removed = before - data.remarks.length;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return NextResponse.json({ success: true, removed });
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
      // Expect { userId, userName, filename, cohorts, totalRows, submittedCount, notSubmittedCount }
      trackCSVUpload({
        userId: data.userId,
        userName: data.userName,
        filename: data.filename,
        cohorts: data.cohorts || [],
        totalRows: Number(data.totalRows || 0),
        submittedCount: Number(data.submittedCount || 0),
        notSubmittedCount: Number(data.notSubmittedCount || 0),
      });
      return NextResponse.json({ success: true });
    }
    if (type === 'remark') {
      // Expect { userId, userName, learnerEmail, learnerCohort, remark, csvFilename }
      trackRemark({
        userId: data.userId,
        userName: data.userName,
        learnerEmail: data.learnerEmail,
        learnerCohort: data.learnerCohort,
        remark: data.remark,
        csvFilename: data.csvFilename || ''
      });
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'Unknown type' }, { status: 400 });
  } catch (e) {
    console.error('Tracking POST error:', e);
    return NextResponse.json({ error: 'Failed to write tracking data' }, { status: 500 });
  }
}
