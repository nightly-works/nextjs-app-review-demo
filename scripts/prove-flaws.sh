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

status=0
for n in 1 2 3 4; do
  line=$(grep -E "^(not )?ok [0-9]+ - ${n}\. " <<<"$tap" || true)
  case "$line" in
    "not ok"*) echo "as delivered, attack works: ${line#*- }" ;;
    "ok"*) echo "as delivered, test passed (attack did not reproduce): ${line#*- }"; status=1 ;;
    *) echo "missing: test ${n}"; status=1 ;;
  esac
done
exit $status
