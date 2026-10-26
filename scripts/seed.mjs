// Writes the demo data: two companies, three users, four notes. Password for every user: "demo".
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomBytes, scryptSync } from 'node:crypto';

const hash = (pw) => {
  const salt = randomBytes(16).toString('hex');
  return `scrypt$${salt}$${scryptSync(pw, salt, 32).toString('hex')}`;
};

export function seed(file = process.env.DATA_FILE ?? 'data/db.json') {
  const data = {
    orgs: [{ id: 'acme', name: 'Acme' }, { id: 'globex', name: 'Globex' }],
    users: [
      { id: 'u-alice', name: 'Alice', email: 'alice@acme.test', passwordHash: hash('demo'), orgId: 'acme' },
      { id: 'u-carol', name: 'Carol', email: 'carol@acme.test', passwordHash: hash('demo'), orgId: 'acme' },
      { id: 'u-bob', name: 'Bob', email: 'bob@globex.test', passwordHash: hash('demo'), orgId: 'globex' },
    ],
    notes: [
      { id: 'n-acme-1', orgId: 'acme', authorId: 'u-alice', title: 'Acme pricing 2027', body: 'Raise enterprise tier by 12 %.' },
      { id: 'n-acme-2', orgId: 'acme', authorId: 'u-carol', title: 'Acme hiring plan', body: 'Two engineers in Q1.' },
      { id: 'n-acme-3', orgId: 'acme', authorId: 'u-alice', title: 'Acme board notes', body: 'Confidential.' },
      { id: 'n-globex-1', orgId: 'globex', authorId: 'u-bob', title: 'Globex roadmap', body: 'Ship the mobile app.' },
    ],
  };
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(data, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) seed();
