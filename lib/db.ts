// A JSON file stands in for the database (Postgres, Supabase...) so the demo runs without services.
import { readFileSync, writeFileSync } from 'node:fs';

export type User = { id: string; name: string; email: string; passwordHash: string; orgId: string };
export type Note = { id: string; orgId: string; authorId: string; title: string; body: string };
type Data = { orgs: { id: string; name: string }[]; users: User[]; notes: Note[] };

const file = () => process.env.DATA_FILE ?? 'data/db.json';
const load = (): Data => JSON.parse(readFileSync(file(), 'utf8'));
const save = (data: Data) => writeFileSync(file(), JSON.stringify(data, null, 2));

export const db = {
  userById: (id: string) => load().users.find((u) => u.id === id),
  userByEmail: (email: string) => load().users.find((u) => u.email === email),
  usersForOrg: (orgId: string) => load().users.filter((u) => u.orgId === orgId),
  org: (id: string) => load().orgs.find((o) => o.id === id),
  notesForOrg: (orgId: string) => load().notes.filter((n) => n.orgId === orgId),
  note: (id: string) => load().notes.find((n) => n.id === id),
  addNote(note: Note) {
    const data = load();
    data.notes.push(note);
    save(data);
  },
  deleteNote(id: string) {
    const data = load();
    data.notes = data.notes.filter((n) => n.id !== id);
    save(data);
  },
};
