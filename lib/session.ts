// Signed session cookie: "<user id>.<HMAC-SHA256 of the id>". Real apps would use their auth
// provider's session (Supabase, Auth.js...); what matters here is where the session is checked.
import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { db } from './db';

const secret = () => process.env.SESSION_SECRET ?? 'dev-only-secret';

export function sign(userId: string): string {
  return `${userId}.${createHmac('sha256', secret()).update(userId).digest('base64url')}`;
}

export function verify(value: string | undefined): string | null {
  if (!value) return null;
  const [userId, mac] = value.split('.');
  if (!userId || !mac) return null;
  const expected = Buffer.from(createHmac('sha256', secret()).update(userId).digest('base64url'));
  const given = Buffer.from(mac);
  return given.length === expected.length && timingSafeEqual(given, expected) ? userId : null;
}

export async function getCurrentUser() {
  const userId = verify((await cookies()).get('session')?.value);
  return userId ? db.userById(userId) ?? null : null;
}
