'use server';

import { scryptSync, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { sign } from '@/lib/session';

export async function login(formData: FormData) {
  const user = db.userByEmail(String(formData.get('email') ?? ''));
  const [, salt, hash] = user?.passwordHash.split('$') ?? [];
  const given = scryptSync(String(formData.get('password') ?? ''), salt ?? 'none', 32);
  if (!user || !hash || !timingSafeEqual(given, Buffer.from(hash, 'hex'))) redirect('/login?error=1');

  (await cookies()).set('session', sign(user.id), { httpOnly: true, sameSite: 'lax', path: '/' });
  redirect('/dashboard');
}
