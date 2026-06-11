process.env.NODE_ENV = process.env.NODE_ENV ?? "test";
process.env.APP_ENV = process.env.APP_ENV ?? "test";
process.env.NEXT_PUBLIC_APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
process.env.AUTH_SECRET =
  process.env.AUTH_SECRET ?? "test-secret-with-enough-length-for-auth-js";
process.env.AUTH_URL = process.env.AUTH_URL ?? "http://localhost:3000";
process.env.ALLOW_ADDITIONAL_ORG_SIGNUPS =
  process.env.ALLOW_ADDITIONAL_ORG_SIGNUPS ?? "false";
