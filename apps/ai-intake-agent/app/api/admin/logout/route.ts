import { NextResponse } from 'next/server';
import { getAdminCookieName } from '@/lib/auth';

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(getAdminCookieName(), '', { maxAge: 0, path: '/' });
  return res;
}
