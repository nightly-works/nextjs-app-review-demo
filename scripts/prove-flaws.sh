#!/usr/bin/env bash
# Builds the app as delivered (tag as-delivered) in a temporary worktree and runs the attack tests
# against it: each numbered test must fail there, i.e. every attack worked before the fixes.
# Needs a full clone (the tag) and network access for `npm ci`.
set -euo pipefail
cd "$(dirname "$0")/.."

dir=$(mktemp -d)
cleanup() { git worktree remove --force "$dir" >/dev/null 2>&1 || rm -rf "$dir"; }
trap cleanup EXIT

git worktree add -q --detach "$dir" as-delivered
(cd "$dir" && npm ci --no-audit --no-fund >/dev/null && NEXT_TELEMETRY_DISABLED=1 npx next build >/dev/null 2>&1)

tap=$(APP_DIR="$dir" PORT=4311 node --test --test-reporter=tap tests/attacks.test.mjs 2>&1 || true)

# The diagnostic block TAP prints under a test's result line, up to the next result.
block() { awk -v n="$1" '$0 ~ "^(not )?ok [0-9]+ - " n "\\. " {on=1; next} on && /^(not )?ok [0-9]+ - / {exit} on' <<<"$tap"; }

status=0
for n in 1 2 3 4; do
  line=$(grep -E "^(not )?ok [0-9]+ - ${n}\. " <<<"$tap" || true)
  case "$line" in
    # Only a failed assertion shows the attack worked; a crash (server down, fetch error) proves nothing.
    "not ok"*) if block "$n" | grep -q "ERR_ASSERTION"; then echo "as delivered, attack works: ${line#*- }"
               else echo "as delivered, test crashed (proves nothing): ${line#*- }"; status=1; fi ;;
    "ok"*) echo "as delivered, test passed (attack did not reproduce): ${line#*- }"; status=1 ;;
    *) echo "missing: test ${n}"; status=1 ;;
  esac
done
exit $status
