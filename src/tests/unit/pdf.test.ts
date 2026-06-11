import { describe, expect, it } from "vitest";
import { renderSimplePdfFromHtml } from "@/utils/pdf";

describe("PDF rendering", () => {
  it("renders a binary PDF from HTML content", () => {
    const pdf = renderSimplePdfFromHtml(
      "Proposal",
      "<article><h1>Proposal</h1><p>Approved scope</p></article>",
    );

    expect(pdf.subarray(0, 8).toString("ascii")).toBe("%PDF-1.4");
    expect(pdf.toString("ascii")).toContain("Approved scope");
  });
});
