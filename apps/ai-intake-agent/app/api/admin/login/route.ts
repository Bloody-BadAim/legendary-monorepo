import { NextResponse } from 'next/server';
import {
  getAdminSecret,
  getAdminPassword,
  getAdminCookieName,
} from '@/lib/auth';

export async function POST(request: Request) {
  const secret = getAdminSecret();
  const password = getAdminPassword();

  if (!secret || !password) {
    return NextResponse.json(
      { error: 'Admin not configured (ADMIN_PASSWORD / ADMIN_SECRET)' },
      { status: 500 }
    );
  }

  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (body.password !== password) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set(getAdminCookieName(), secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });

  return res;
}
