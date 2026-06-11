import { describe, expect, it } from "vitest";
import { createSlug } from "@/utils/slug";

describe("slug generation", () => {
  it("creates stable organisation slugs", () => {
    expect(createSlug(" LeadFlow OS Ltd. ")).toBe("leadflow-os-ltd");
  });

  it("uses a fallback for empty input", () => {
    expect(createSlug("!!!")).toBe("organisation");
  });
});
