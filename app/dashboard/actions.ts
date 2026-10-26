'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';

// The delete button is only shown on the user's own notes.
export async function deleteNote(formData: FormData) {
  db.deleteNote(String(formData.get('id')));
  revalidatePath('/dashboard');
}
