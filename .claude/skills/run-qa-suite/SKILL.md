---
name: run-qa-suite
description: Run end-to-end QA for the current Linkbase feature. Loads the QA Scenarios from ./plans/<current-branch>.md, starts the app on localhost:3000 against the test database (MONGODB_URI_TEST from .env.test), and drives each scenario in a real browser with Playwright MCP, covering the happy path, auth boundaries, validation and edge cases. Fixes failing code and re-runs (at most 3 attempts per failure), then reports. Use whenever the user asks to run QA, test the app, QA a feature or branch, run the QA suite, check a feature end to end, or "make sure it works in the browser".
---

# Run the QA suite

Drive the running app through the plan's QA Scenarios with Playwright MCP, against the **test database only**. Fix what fails, re-run, and report. Follow `docs/testing.md`; if anything below conflicts with it, `docs/testing.md` wins.

## 1. Load the scenarios

1. Get the branch: `git branch --show-current`. If it's `main`, stop and ask which feature to QA.
2. Read `./plans/<branch>.md` (for `feat/add-links`, that's `plans/feat/add-links.md`). If there's no plan file, stop and suggest `plan-feature`.
3. Collect every numbered item under each **QA Scenarios** heading. A plan file can hold several plans for the same branch; run the scenarios from all of them.
4. Read `docs/testing.md`, plus the docs for the area under test (for example `docs/auth.md` for sign-in), so you know what correct behavior is.

Each scenario is a contract: the steps and the visible result it describes are what passes. Don't reinterpret or weaken one to make it pass. If a scenario looks wrong or contradicts the docs, stop and ask.

## 2. Point the app at the test database

Never run QA against the dev or prod database. **Never print a connection string.** The commands below report only `ok` or a reason.

1. **Check the test database is safe to use.** Run:

   ```bash
   node --env-file-if-exists=.env.local --env-file-if-exists=.env --env-file-if-exists=.env.test -e "
   const t = process.env.MONGODB_URI_TEST, d = process.env.MONGODB_URI;
   const name = (u) => (u.split('?')[0].match(/\/([^/]+)$/) || [])[1] || '';
   if (!t) { console.log('MONGODB_URI_TEST is not set in .env.test'); process.exit(1); }
   if (t === d) { console.log('MONGODB_URI_TEST is the same as the dev MONGODB_URI'); process.exit(1); }
   if (!/test/i.test(name(t))) { console.log('Test database name must contain \"test\"'); process.exit(1); }
   console.log('ok');"
   ```

   Anything but `ok`: stop and tell the user what to fix. Don't create or edit `.env.test` yourself.

2. **Make sure port 3000 is free.** If something is already listening, it may be a dev server on the dev database. Stop and ask the user to stop it. Don't reuse it, and don't kill it yourself.

3. **Start the app on the test database** in the background (Bash tool, `run_in_background: true`). Next.js doesn't override variables already set in the process, so this `MONGODB_URI` wins over `.env.local`:

   ```bash
   node --env-file=.env.test -e "
   const { spawn } = require('node:child_process');
   const env = { ...process.env, MONGODB_URI: process.env.MONGODB_URI_TEST };
   spawn('npx', ['next', 'dev', '-p', '3000'], { env, stdio: 'inherit', shell: true });"
   ```

   Wait until the server output shows it's ready, then load `http://localhost:3000` once to compile it.

## 3. Reset the test database between scenarios

Before **every** scenario, clear the data so no scenario depends on another (see `docs/testing.md`):

```bash
node --env-file=.env.test -e "
const mongoose = require('mongoose');
(async () => {
  const conn = await mongoose.connect(process.env.MONGODB_URI_TEST);
  const db = conn.connection.db;
  if (!/test/i.test(db.databaseName)) throw new Error('Refusing to reset a database whose name lacks \"test\"');
  for (const c of await db.collections()) await c.deleteMany({});
  console.log('reset ' + db.databaseName);
  await mongoose.disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });"
```

- **Delete documents; don't drop the database or collections.** The running app builds its indexes (unique email, rate-limit TTL) only once, at startup, so dropping them would make later scenarios pass or fail for the wrong reason.
- This also clears the rate-limit counters, so one scenario's attempts never count against the next.
- Clear the browser's session too: run `await page.context().clearCookies()` with `browser_run_code_unsafe`, or start a scenario signed out some other way. Don't rely on sign-out from the previous scenario.

## 4. Run the scenarios

Load the Playwright MCP tools with ToolSearch (`select:mcp__playwright__browser_navigate,mcp__playwright__browser_snapshot,...`) before the first call. For each scenario, in order:

1. Reset the database and cookies (step 3).
2. Use `browser_navigate` to open the starting URL on `http://localhost:3000`.
3. Use `browser_snapshot` to find elements by role and label, then interact with `browser_fill_form`, `browser_type`, `browser_click` and `browser_press_key`. Prefer the snapshot over screenshots for checks.
4. Use the scenario's exact inputs, and create any data it needs inside the scenario, for example by signing up a fresh `qa+<timestamp>@example.com`.
5. Check every result the scenario names: URL and redirects, visible text and error messages, header state, and anything else it lists. Use `browser_wait_for` for text that streams in.
6. Check `browser_console_messages` for errors, and `browser_network_requests` for failed (5xx) requests.
7. Mark the scenario **pass** or **fail**, noting what was expected and what happened.

After the first scenario that writes data, confirm once that the write landed in the test database (count the documents with the reset script's connection, without deleting). That proves the app isn't using the dev database. If the count is zero, stop: the app is pointed somewhere else.

Cover what the plan lists. If its scenarios miss one of the four required kinds (happy path, auth boundary, validation, edge case), say so in the report. Don't invent extra pass/fail criteria.

## 5. Fix failures

When a scenario fails:

1. **Diagnose before changing anything.** Read the dev server output, the browser console, the network requests and the relevant code. Find the root cause, not the symptom.
2. **Fix it in the app code**, following the project docs (`docs/coding-standards.md` plus the area's doc) and the "Live Docs" rule in `CLAUDE.md` for library APIs. Keep the fix minimal and within the feature.
   - Don't change the scenario, the plan, or the tests to make it pass.
   - Don't edit `.env`, `.env.local` or `.env.test`.
   - Don't weaken security (validation, rate limits, auth checks) to get a pass.
3. Run `npm run lint`. Then re-run **the failing scenario**, with a reset first.
4. **Cap: 3 attempts on the same failure.** If it still fails after the third fix, stop. Report what's blocking: the scenario, the error, what you tried and your best guess at the cause.

Once every scenario has passed at least once after a fix, **re-run the full suite from the top** to catch regressions. Fixes count toward the same cap.

## 6. Finish

- Stop the dev server you started and close the browser (`browser_close`).
- **Don't commit or push.**

**On all green**, report a short summary:

- A table with one row per scenario: name, result and a few words on what was checked.
- Any fixes made: file, what changed and why.
- Gaps: missing scenario kinds, or anything the scenarios couldn't verify.

Then stop.

**If blocked**, report the passing and failing scenarios, the blocking failure with its evidence and the attempts made. Then stop and wait for the user.
