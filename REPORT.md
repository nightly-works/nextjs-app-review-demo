# Security review: Team Notes (sample report)

*Team Notes is a fictional app built for this demo: a multi-company notes app on Next.js 16 of the kind AI coding tools generate. Review by an AI agent (Claude), Nightly Works.*

**Scope**: server actions, route handlers, the proxy (Next.js 16's name for middleware) and what server components send to the browser. Reviewed on a copy of the code; no live system was touched.
**Method**: source read; each suspected flaw written as an HTTP attack on the built app (`tests/attacks.test.mjs`) and run against the code as delivered (`scripts/prove-flaws.sh`: every attack works), then fixed one commit at a time until the same attacks are refused.
**Result**: 4 findings: 2 high, 2 medium. All fixed, each with a test that fails if the flaw comes back.

## Summary for the owner

Any signed-in user can read every company's notes and delete their colleagues' notes, and anyone can read a note through the API without signing in. The pages also send every colleague's email and password hash to the browser. The common cause: the app trusts what the browser shows (hidden buttons, the workspace in the URL, the login redirect) instead of checking on the server. The fixes are about 30 lines.

## Findings

### 1. Any user can delete any note (high)

**What**: the `deleteNote` server action deletes the note id it receives. The Delete button only appears on the user's own notes, but a server action is a public POST endpoint: anyone who has seen one form knows the action's id and can send it any note id.
**Impact**: a member deletes colleagues' notes, and other companies' notes.
**Fix**: the action reads the session and deletes only a note whose author is the signed-in user.
**Verified**: the delete form re-submitted by Carol with Alice's note id, and by Bob with an Acme note id, deletes nothing; Alice still deletes her own (test 1).

### 2. The notes API answers anyone (high)

**What**: `GET /api/notes/[id]` returns any note and checks nothing. The app relies on the proxy for sign-in, and the proxy's matcher covers `/dashboard` only. It also only checks that a `session` cookie exists, not that it is valid.
**Impact**: anyone on the internet, signed in or not, reads any company's note by id.
**Fix**: the handler checks the session and the note's company, and answers 404 for another company's note so ids cannot be probed. The proxy stays as a convenience redirect, with a comment saying it is not the security boundary.
**Verified**: a request without a session and one from another company get no note; a colleague gets it (test 2).

### 3. Any user can open another company's workspace (medium)

**What**: the dashboard takes the company from `?org=` (meant for a workspace switcher) without checking membership.
**Impact**: Bob from Globex opens `/dashboard?org=acme` and reads Acme's notes.
**Fix**: the dashboard shows the signed-in user's company only.
**Verified**: Bob's request with `?org=acme` shows no Acme note; his own workspace works (test 3).

### 4. Colleagues' emails and password hashes sent to the browser (medium)

**What**: the dashboard passes whole user rows to the `MemberList` client component, which displays names only. Next.js serializes a client component's props into the page, so every field ships in the HTML.
**Impact**: any member reads colleagues' emails and password hashes in the page source; the hashes can be attacked offline.
**Fix**: the server component passes `{ id, name }` only.
**Verified**: the dashboard's HTML contains member names but no email and no hash (test 4).

## Checked next in a full review

Every other server action (including login: rate limiting and lockout), cookie flags in production, CSRF on route handlers that change data, file uploads, environment variables prefixed `NEXT_PUBLIC_`, the database's own access rules (RLS when on Supabase), and the Next.js version against current advisories.
