# Testing

LeadFlow OS uses Vitest for unit/integration tests and Playwright for E2E smoke tests.

## Commands

```bash
npm run lint
npm run test
npm run build
npm run test:e2e
```

`npm run test:e2e` expects a running app.

## Test Layout

```text
src/tests/
  unit/
  integration/
  e2e/
  setup.ts
```

## Unit Tests

Unit tests cover pure helpers and validation:

- Zod validation.
- CSV parsing.
- Personalisation.
- Campaign scheduling.
- Deliverability.
- AI prompts.
- PDF rendering.
- HTML sanitization.
- Rate-limit helper behavior.

Prefer unit tests for deterministic logic that does not need MongoDB.

## Integration Tests

Integration tests use MongoMemoryServer and real Mongoose models/services.

Common pattern:

1. Start `MongoMemoryServer` in `beforeAll`.
2. Set `process.env.MONGODB_URI`.
3. Bootstrap first owner if needed.
4. Exercise service functions.
5. Delete all touched models in `afterEach`.
6. Disconnect and stop Mongo in `afterAll`.

Important cleanup:

- If a test calls `createFirstOwner`, clean up `SetupLock`, `Organisation`, and `User`.
- Clean up all related models touched by the test.
- Reset `ALLOW_ADDITIONAL_ORG_SIGNUPS=false`.
- Use `vi.useRealTimers()` after fake timers.

## E2E Tests

Playwright currently has a smoke test that reaches the app entrypoint.

Future E2E coverage should include:

- Signup/login.
- Lead import.
- Campaign creation.
- Send batch generation/approval.
- Discovery submission.
- Proposal creation.
- Client conversion.
- Time logging.
- Portal access and signing.

## Test Writing Rules

- Prefer service-level integration tests for business rules.
- Add tests when changing security-sensitive code.
- Add tests when changing tenant-scoped reference validation.
- Add tests when expanding rich HTML allowlists.
- Keep tests deterministic; pass explicit `now` values to job helpers.

## Known Test Caveat

Several integration suites start their own MongoMemoryServer. If the machine is under heavy load, startup contention can cause timeouts. Rerun the suite once before assuming a product failure.

