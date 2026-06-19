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

Use unit tests for deterministic helpers and validation.

Current examples include lifecycle helpers, lead validation, research prompts, command center areas, PDF rendering, HTML sanitization, and rate limiting.

## Integration Tests

Integration tests use MongoMemoryServer and real Mongoose models/services.

Common pattern:

1. Start `MongoMemoryServer` in `beforeAll`.
2. Set `process.env.MONGODB_URI`.
3. Bootstrap first owner if needed.
4. Exercise service functions.
5. Delete all touched models in `afterEach`.
6. Disconnect and stop Mongo in `afterAll`.

## Removed Outreach Tests

Campaign, sending, warmup, Mailgun, positive-reply automation, cold email, reply draft, spintax, and email-personalisation tests have been removed with the feature.
