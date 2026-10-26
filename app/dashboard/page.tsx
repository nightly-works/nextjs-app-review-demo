import { redirect } from 'next/navigation';
import { MemberList } from '@/components/MemberList';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';
import { deleteNote } from './actions';

export default async function Dashboard() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  // The company comes from the signed-in user, never from the URL.
  const orgId = user.orgId;

  const notes = db.notesForOrg(orgId);
  const members = db.usersForOrg(orgId);

  return (
    <main>
      <h1>{db.org(orgId)?.name} notes</h1>
      <ul>
        {notes.map((note) => (
          <li key={note.id}>
            <strong>{note.title}</strong> {note.body}
            {note.authorId === user.id && (
              <form action={deleteNote}>
                <input type="hidden" name="id" value={note.id} />
                <button>Delete</button>
              </form>
            )}
          </li>
        ))}
      </ul>
      <MemberList members={members} />
    </main>
  );
}
