import { db } from '@/lib/db';

// Used by the note preview popover.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const note = db.note((await params).id);
  if (!note) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json(note);
}
