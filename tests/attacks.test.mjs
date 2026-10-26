// Each finding of REPORT.md as an HTTP attack on the built app (`next build` first), sent as a browser
// or curl would send it. A test passes only when the attack is refused and normal use still works.
// APP_DIR selects the app to attack (default: this one); scripts/prove-flaws.sh points it at the app
// as delivered, where every numbered test must fail.
import { after, before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHmac } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { seed } from '../scripts/seed.mjs';

const APP_DIR = resolve(process.env.APP_DIR ?? '.');
const PORT = Number(process.env.PORT ?? 4310);
const BASE = `http://127.0.0.1:${PORT}`;
const SECRET = 'test-session-secret';
const tmp = mkdtempSync(join(tmpdir(), 'notes-'));
const DATA_FILE = join(tmp, 'db.json');
let server;

const session = (userId) => `session=${userId}.${createHmac('sha256', SECRET).update(userId).digest('base64url')}`;
const as = (userId) => (userId ? { cookie: session(userId) } : {});
const page = async (path, userId) => (await fetch(BASE + path, { headers: as(userId), redirect: 'manual' })).text();
const noteIds = () => JSON.parse(readFileSync(DATA_FILE, 'utf8')).notes.map((n) => n.id);

// Submits the delete form the way a browser without JavaScript does, with any note id.
async function submitDelete(userId, noteId) {
  const html = await page('/dashboard', userId);
  const actionField = html.match(/name="(\$ACTION_ID_[0-9a-f]+)"/)?.[1];
  assert.ok(actionField, 'the dashboard shows this user a delete form');
  const form = new FormData();
  form.set(actionField, '');
  form.set('id', noteId);
  await fetch(BASE + '/dashboard', { method: 'POST', body: form, headers: as(userId), redirect: 'manual' });
}

before(async () => {
  seed(DATA_FILE);
  server = spawn(process.execPath, [join(APP_DIR, 'node_modules/next/dist/bin/next'), 'start', '-p', String(PORT)], {
    cwd: APP_DIR,
    env: { ...process.env, DATA_FILE, SESSION_SECRET: SECRET, NEXT_TELEMETRY_DISABLED: '1' },
    stdio: 'ignore',
  });
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(BASE + '/login')).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`next start did not answer on ${BASE}; run next build in ${APP_DIR} first`);
});

after(() => {
  server?.kill();
  rmSync(tmp, { recursive: true, force: true });
});

beforeEach(() => seed(DATA_FILE));

test("1. a member cannot delete a colleague's note through the server action", async () => {
  await submitDelete('u-carol', 'n-acme-1'); // Alice's note, same company
  await submitDelete('u-bob', 'n-acme-3'); // another company's note
  assert.ok(noteIds().includes('n-acme-1'));
  assert.ok(noteIds().includes('n-acme-3'));

  await submitDelete('u-alice', 'n-acme-3'); // her own note
  assert.ok(!noteIds().includes('n-acme-3'));
});

test('2. the notes API answers only members of the note\'s company', async () => {
  for (const userId of [null, 'u-bob']) {
    const res = await fetch(BASE + '/api/notes/n-acme-1', { headers: as(userId), redirect: 'manual' });
    assert.notEqual(res.status, 200, `as ${userId ?? 'a stranger'}`);
    assert.ok(!(await res.text()).includes('Raise enterprise tier'));
  }
  const own = await fetch(BASE + '/api/notes/n-acme-1', { headers: as('u-carol') });
  assert.equal(own.status, 200);
  assert.equal((await own.json()).title, 'Acme pricing 2027');
});

test("3. a member cannot open another company's workspace from the URL", async () => {
  const html = await page('/dashboard?org=acme', 'u-bob');
  assert.ok(!html.includes('Acme pricing 2027'));
  assert.ok((await page('/dashboard', 'u-bob')).includes('Globex roadmap'));
});

test("4. pages do not send colleagues' emails or password hashes to the browser", async () => {
  const html = await page('/dashboard', 'u-alice');
  assert.ok(html.includes('Carol'), 'member names are still shown');
  assert.ok(!html.includes('carol@acme.test'), 'email in the page payload');
  assert.ok(!html.includes('scrypt$'), 'password hash in the page payload');
});
