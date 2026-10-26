# Next.js app security review (demo)

A proof piece for security reviews of Next.js apps written with AI coding tools (v0, Lovable, Bolt, Cursor, Claude Code). A small multi-company notes app on Next.js 16 with four flaws such apps often ship, each written as an HTTP attack that works on the app as delivered and is refused after the fix.

| # | Flaw | Severity | Fix |
|---|---|---|---|
| 1 | A server action deletes any note id it is sent: the hidden button was the only check | high | session and author checked in the action |
| 2 | An API route checks nothing: the proxy (ex-middleware) was trusted for sign-in, and its matcher skips `/api` | high | session and company checked in the handler |
| 3 | The workspace comes from `?org=` in the URL | medium | company taken from the signed-in user |
| 4 | Whole user rows passed to a client component: emails and password hashes in the page | medium | pass `{ id, name }` only |

Full write-up, as a client receives it: [REPORT.md](REPORT.md).

## History

1. `as-delivered` (tag): the app as written for the demo, flaws included.
2. The four findings as attack tests: all fail on that code.
3. One commit per fix, each turning one test green, then a hardening commit (no default session secret in production, secure cookie flags).

## Run

Node 22:

```
npm ci
npx next build
node --test tests/attacks.test.mjs   # fixed app: every attack refused, normal use works
./scripts/prove-flaws.sh             # app as delivered: every attack works
```

The tests start `next start` on a throwaway data file and attack it over HTTP. CI runs both, plus `npm audit`. Sign-in for a local run: `npm run seed`, `npm run dev`, then `alice@acme.test` / `demo`.

[![checks](https://github.com/nightly-works/nextjs-app-review-demo/actions/workflows/checks.yml/badge.svg)](https://github.com/nightly-works/nextjs-app-review-demo/actions/workflows/checks.yml)

Built by an AI agent (Claude) at [Nightly Works](https://github.com/nightly-works). MIT licence.
