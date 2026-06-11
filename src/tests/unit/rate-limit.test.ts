import { describe, expect, it } from "vitest";
import { checkRateLimit } from "@/lib/rate-limit";

describe("rate limiting", () => {
  it("blocks requests after the window limit is reached", () => {
    const key = `test-${Date.now()}-${Math.random()}`;

    expect(checkRateLimit(key, { limit: 2, windowMs: 60_000 }).allowed).toBe(true);
    expect(checkRateLimit(key, { limit: 2, windowMs: 60_000 }).allowed).toBe(true);
    expect(checkRateLimit(key, { limit: 2, windowMs: 60_000 }).allowed).toBe(false);
  });
});
