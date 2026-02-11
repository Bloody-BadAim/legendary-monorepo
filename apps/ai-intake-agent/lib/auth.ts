import { cookies } from 'next/headers';

const ADMIN_COOKIE = 'admin_session';

export function getAdminSecret(): string | undefined {
  return process.env.ADMIN_SECRET;
}

export function getAdminPassword(): string | undefined {
  return process.env.ADMIN_PASSWORD;
}

/** Check if request has valid admin session cookie. */
export async function isAdminAuthenticated(): Promise<boolean> {
  const secret = getAdminSecret();
  const cookieStore = await cookies();
  const value = cookieStore.get(ADMIN_COOKIE)?.value;
  return Boolean(secret && value === secret);
}

export function getAdminCookieName(): string {
  return ADMIN_COOKIE;
}
