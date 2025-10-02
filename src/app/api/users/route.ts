import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const FILE = path.join(DATA_DIR, 'users.json');

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
  const body = await req.json();
  await ensureFile();
  const raw = await fs.readFile(FILE, 'utf8');
  const data = JSON.parse(raw || '[]');
  data.push(body);
  await fs.writeFile(FILE, JSON.stringify(data, null, 2), 'utf8');
  return NextResponse.json({ success: true });
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
    const before = Array.isArray(data) ? data.length : 0;
    const filtered = (Array.isArray(data) ? data : []).filter((u: any) => u.id !== id);
    const removed = before - filtered.length;
    await fs.writeFile(FILE, JSON.stringify(filtered, null, 2), 'utf8');
    return NextResponse.json({ success: true, removed });
  } catch (e) {
    console.error('Failed to delete user:', e);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
