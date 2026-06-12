import { describe, expect, it } from "vitest";
import { sanitizeRichHtml } from "@/utils/html";

describe("HTML sanitization", () => {
  it("keeps allowed document tags and strips attributes", () => {
    const html = sanitizeRichHtml(
      '<article onclick="alert(1)"><h1>Title</h1><script>alert(1)</script><p>Body</p></article>',
    );

    expect(html).toContain("<article>");
    expect(html).toContain("<h1>");
    expect(html).toContain("<p>");
    expect(html).not.toContain("onclick");
    expect(html).not.toContain("<script>");
  });
});
