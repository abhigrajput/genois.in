import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const PLACEMENT_PIN = process.env.PLACEMENT_PIN || 'KLE2025';
const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;

export async function POST(request) {
  try {
    const { pin } = await request.json();
    if (!pin || pin !== PLACEMENT_PIN) {
      return NextResponse.json({ success: false, message: 'Invalid PIN' }, { status: 401 });
    }
    if (!JWT_SECRET) {
      return NextResponse.json({ success: false, message: 'Server misconfigured' }, { status: 500 });
    }
    const token = jwt.sign({ role: 'placement_admin' }, JWT_SECRET, { expiresIn: '24h' });
    return NextResponse.json({ success: true, token });
  } catch {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
