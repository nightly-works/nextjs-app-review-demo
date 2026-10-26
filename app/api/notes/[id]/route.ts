import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';

// Used by the note preview popover. The proxy does not cover /api, and should not be the only
// check anyway: the handler verifies the session and the company itself.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: 'Sign in first' }, { status: 401 });

  const note = db.note((await params).id);
  // Another company's note answers like a missing one, so ids cannot be probed.
  if (!note || note.orgId !== user.orgId) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json(note);
}
