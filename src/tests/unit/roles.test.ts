import { describe, expect, it } from "vitest";
import { roles, type SessionUser } from "@/types/auth";

describe("role and session types", () => {
  it("contains the planned role set", () => {
    expect(roles).toEqual(["owner", "admin", "member"]);
  });

  it("supports the organisation-aware session shape", () => {
    const user: SessionUser = {
      id: "user_1",
      email: "owner@example.com",
      name: "Owner",
      organisationId: "org_1",
      role: "owner",
    };

    expect(user.role).toBe("owner");
  });
});
