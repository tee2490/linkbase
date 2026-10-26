---
name: run-qa-suite
description: Run end-to-end QA for the current Linkbase feature with Playwright MCP, following docs/testing.md. Use whenever the user asks to run QA, test the app, QA the feature or branch, check that the feature works in the browser, or run the QA scenarios ("run QA", "test the app", "QA this", "run the QA suite"). Loads the QA Scenarios from ./plans/<branch>.md, runs the app on localhost:3000 against the test database (MONGODB_URI_TEST), drives every scenario in a real browser, fixes failures in code (max 3 attempts per failure), and reports a summary.
---

# Run the QA suite

Run end-to-end QA for the feature on the current branch, in a real browser through the Playwright MCP tools (`mcp__playwright__*`). Read `docs/testing.md` first. Its rules on the test database and test independence apply throughout.

**Out of scope:** writing unit tests (that's `write-tests`), committing, pushing or opening PRs. Never write `.spec.ts` files, an `/e2e` folder or `playwright.config.ts`.

## 1. Load the scenarios

1. Run `git branch --show-current`. If it prints nothing or `main`, stop and ask for a feature branch.
2. Read `./plans/<branch>.md`, with `/` replaced by `-` (`feat/auth` → `plans/feat-auth.md`). If it's missing, or has no **QA Scenarios** section, stop and suggest running `plan-feature` first.
3. List the scenarios. Each one is "what the user does → what should happen". Check that they cover at least:
   - the happy path
   - the auth boundary
   - validation
   - one edge case

   If one of these is missing, say so in the report, but run what's there.
4. Read the plan's Files and Notes sections too. They say which routes, fields and messages to expect.

## 2. Point the app at the test database

QA never touches the development or production database (`docs/testing.md` → Test database).

1. **Check the env without printing secrets.** Run this and read only its one-word output:

   ```bash
   node --env-file-if-exists=.env.local --env-file-if-exists=.env.test -e "const t=process.env.MONGODB_URI_TEST, d=process.env.MONGODB_URI; console.log(!t ? 'missing' : t===d ? 'same' : /test/i.test(new URL(t.replace(/^mongodb(\+srv)?:/, 'http:')).pathname) ? 'ok' : 'no-test-name')"
   ```

   - **`ok`:** carry on.
   - **`missing`:** stop and ask the user to create `.env.test` with `MONGODB_URI_TEST=…`. The protect-env hook blocks you from writing it.
   - **`same`:** stop. The test and dev URIs must differ.
   - **`no-test-name`:** stop and ask for a database name containing `test`, e.g. `linkbase_test`.

   Never print, log or echo a connection string.
2. **Free port 3000.** Check it with `netstat -ano | grep -E ':3000\s.*LISTENING'`. If something is listening, it's probably the user's dev server, which uses the dev database. Ask the user to stop it with Ctrl+C. Don't kill a process you didn't start, and don't run QA against it.
3. **Start the QA server** on `localhost:3000` in the background, with `MONGODB_URI` replaced by the test URI. A process env var overrides the `.env*` files:

   ```bash
   MONGODB_URI="$(node --env-file=.env.test -p 'process.env.MONGODB_URI_TEST')" npm run dev
   ```

   Run it with `run_in_background`, then wait until `curl -s -o /dev/null -w '%{http_code}' localhost:3000` returns `200`. If the dev server serves stale CSS or modules (as happened once with the Turbopack cache), stop it, delete `.next` and start it again.

## 3. Reset state before every scenario

Each scenario starts clean and stands alone (`docs/testing.md` → Independence). Before **each** scenario, including a re-run:

1. **Empty the test database's collections.** Keep the collections and their indexes, so unique-email checks still work:

   ```bash
   node --env-file=.env.test -e "const m=require('mongoose');(async()=>{const c=await m.connect(process.env.MONGODB_URI_TEST);if(!/test/i.test(c.connection.name))throw new Error('Refusing: not a test database');for(const col of await c.connection.db.collections())await col.deleteMany({});console.log('reset',c.connection.name);await m.disconnect();})().catch(e=>{console.error(e.message);process.exit(1)})"
   ```

   This also clears `rate_limits`, so earlier scenarios don't trip the sign-in and sign-up limits.
2. **Start the browser signed out.** Clear the cookies with `mcp__playwright__browser_run_code_unsafe` running `async (page) => { await page.context().clearCookies(); }`. `browser_close` only closes the page and keeps the session cookie. A stale cookie for a user the reset deleted sends the scenario down the wrong path.
3. **Create the scenario's own data.** Use unique values such as `qa-<timestamp>-<n>@example.test`. If a scenario needs a signed-in user, sign one up first within that scenario. Never reuse data from another scenario.

## 4. Run each scenario

For each scenario, in any order:

1. Drive it like a user, with the Playwright MCP tools:
   - `browser_navigate` to `http://localhost:3000/...`
   - `browser_snapshot` to read the page
   - `browser_fill_form`, `browser_type` and `browser_click` to act
   - `browser_press_key` for keyboard flows
   - `browser_resize` for mobile widths
   - `browser_wait_for` for redirects and streamed content

   Prefer the accessibility snapshot over screenshots, and target elements by role and label.

   Timing rules:

   - Wait for `networkidle` after each navigation before filling a form, so it doesn't submit before the page's JavaScript loads. Testing a no-JavaScript submit should be its own deliberate check.
   - After an action, wait for the specific outcome, such as the target URL, an alert or a response. If you're already on the target URL, `waitForURL` returns immediately and proves nothing.
2. **Check what the user sees:**
   - URL and redirects
   - visible text and exact error messages
   - focus
   - `aria-invalid`, `aria-expanded` and `role="alert"`
3. **Check what was stored,** where the scenario writes data. Query the test database with a one-off `node --env-file=.env.test -e` script that prints only the fields needed. Never print password hashes in full: check the prefix, e.g. `scrypt$`.
4. Check `browser_console_messages` for errors, and the dev server output for server errors.
5. Record **pass** or **fail**, with what was observed.

## 5. Fix failures

When a scenario fails:

1. **Diagnose before changing anything.** Read the relevant code, the server output and the console. Decide whether the bug is in the app or the scenario was run wrong (e.g. stale data, a timing issue). Only app bugs get code changes.
2. **Fix the code,** following `/docs` and the plan. Load the docs for the area you touch, as `create-feature` does. Keep the fix to the failing behaviour, don't change the plan's intended behaviour, and never edit `.env*` files.
3. Run `npx tsc --noEmit` and `npm run lint`. Then reset state (step 3) and re-run the failing scenario.
4. **At most 3 attempts on the same failure.** If it still fails after the third fix, stop working on it, revert any partial change that made things worse, and move on to report it as blocking.

After any fix, re-run **every** scenario once more from a clean state, so a fix can't break another scenario unnoticed.

## 6. Finish and report

1. Stop the QA server you started, and close the browser. Remind the user to restart their own dev server (`npm run dev`) if they stopped it.
2. **All green:** report a short summary:
   - each scenario, with a one-line result
   - what was verified in the database
   - any fixes made, with the files changed

   Then stop. Don't commit.
3. **Blocked:** report:
   - which scenario still fails
   - the three attempts and why each didn't work
   - what's blocking (a missing env var, a bug that needs a decision, or a plan that contradicts the docs)
   - the current state of any changes

   Then stop.
