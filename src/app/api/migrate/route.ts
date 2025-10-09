import { NextRequest, NextResponse } from 'next/server';
import { migrateJsonToSupabase, backupJsonData, checkMigrationStatus } from '@/lib/migrate-data';

export async function POST(req: NextRequest) {
  try {
    const { action } = await req.json();

    switch (action) {
      case 'backup':
        const backupResult = backupJsonData();
        return NextResponse.json(backupResult);

      case 'migrate':
        const migrationResult = await migrateJsonToSupabase();
        return NextResponse.json(migrationResult);

      case 'status':
        const status = await checkMigrationStatus();
        return NextResponse.json({ success: true, data: status });

      default:
        return NextResponse.json({ 
          success: false, 
          message: 'Invalid action. Use: backup, migrate, or status' 
        }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Migration API error:', error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Migration failed' 
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const status = await checkMigrationStatus();
    return NextResponse.json({ 
      success: true, 
      message: 'Migration status retrieved',
      data: status 
    });
  } catch (error: any) {
    console.error('Migration status error:', error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Failed to get migration status' 
    }, { status: 500 });
  }
}
