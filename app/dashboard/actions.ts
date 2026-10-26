'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';

// A server action is a public POST endpoint: hiding the button does not protect it, so the
// action checks the session and the note's author itself.
export async function deleteNote(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;

  const note = db.note(String(formData.get('id')));
  if (!note || note.authorId !== user.id) return;

  db.deleteNote(note.id);
  revalidatePath('/dashboard');
}
