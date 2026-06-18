import { describe, expect, it } from "vitest";
import { renderSpintax } from "@/utils/spintax";

describe("spintax", () => {
  it("renders RANDOM choices deterministically by seed", () => {
    const template = "{{RANDOM | Hey | Hi | Hello}} Grace";

    expect(renderSpintax(template, "lead-1")).toBe(
      renderSpintax(template, "lead-1"),
    );
    expect(renderSpintax(template, "lead-1")).toMatch(/^(Hey|Hi|Hello) Grace$/);
  });

  it("leaves malformed spintax unchanged", () => {
    expect(renderSpintax("{{firstName}}")).toBe("{{firstName}}");
  });
});
