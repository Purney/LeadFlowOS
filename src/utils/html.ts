const allowedTags = new Set([
  "article",
  "section",
  "h1",
  "h2",
  "h3",
  "p",
  "ul",
  "ol",
  "li",
  "strong",
  "em",
  "br",
]);

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function sanitizeRichHtml(html: string) {
  return html.replace(/<\/?([a-zA-Z][a-zA-Z0-9-]*)(?:\s[^>]*)?>/g, (match, tag) => {
    const normalized = String(tag).toLowerCase();

    if (!allowedTags.has(normalized)) {
      return escapeHtml(match);
    }

    return match.startsWith("</") ? `</${normalized}>` : `<${normalized}>`;
  });
}
