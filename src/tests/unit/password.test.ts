import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/password";

describe("password helpers", () => {
  it("hashes and verifies passwords", async () => {
    const hash = await hashPassword("CorrectHorse12");

    expect(hash).not.toBe("CorrectHorse12");
    await expect(verifyPassword("CorrectHorse12", hash)).resolves.toBe(true);
    await expect(verifyPassword("WrongHorse12", hash)).resolves.toBe(false);
  });
});
