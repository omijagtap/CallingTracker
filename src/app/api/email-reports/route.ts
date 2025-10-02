import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const FILE = path.join(DATA_DIR, 'email-reports.json');

interface EmailReport {
  id: string;
  userId: string;
  userName: string;
  recipientEmail: string;
  subject: string;
  reportType: 'calling-report' | 'no-submission-report';
  cohorts: string[];
  learnerCount: number;
  sentDate: string;
  status: 'sent' | 'failed';
}

async function ensureFile() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.access(FILE);
  } catch (e) {
    await fs.writeFile(FILE, '[]', 'utf8');
  }
}

export async function GET() {
  await ensureFile();
  const raw = await fs.readFile(FILE, 'utf8');
  const data = JSON.parse(raw || '[]');
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await ensureFile();
    
    const emailReport: EmailReport = {
      id: uuidv4(),
      userId: body.userId,
      userName: body.userName,
      recipientEmail: body.recipientEmail,
      subject: body.subject,
      reportType: body.reportType || 'calling-report',
      cohorts: body.cohorts || [],
      learnerCount: body.learnerCount || 0,
      sentDate: new Date().toISOString(),
      status: body.status || 'sent'
    };

    const raw = await fs.readFile(FILE, 'utf8');
    const data = JSON.parse(raw || '[]');
    data.unshift(emailReport); // Add newest first
    
    // Keep only last 100 reports
    if (data.length > 100) {
      data.splice(100);
    }
    
    await fs.writeFile(FILE, JSON.stringify(data, null, 2), 'utf8');
    return NextResponse.json({ success: true, report: emailReport });
  } catch (error) {
    console.error('Email report tracking error:', error);
    return NextResponse.json({ error: 'Failed to track email report' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }
    
    await ensureFile();
    const raw = await fs.readFile(FILE, 'utf8');
    const data = JSON.parse(raw || '[]');
    const before = data.length;
    const filtered = data.filter((report: EmailReport) => report.id !== id);
    const removed = before - filtered.length;
    
    await fs.writeFile(FILE, JSON.stringify(filtered, null, 2), 'utf8');
    return NextResponse.json({ success: true, removed });
  } catch (error) {
    console.error('Failed to delete email report:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
