// Minimal sanitizer for admin-authored event overview HTML. Paired with the
// editor's paste-as-plain-text, this strips the main injection vectors so the
// stored HTML is safe to render with dangerouslySetInnerHTML on server + client.
export function sanitizeRichText(html: string): string {
  if (!html) return "";
  return html
    .replace(/<\/?(script|style|iframe|object|embed|link|meta|form|input|svg)\b[^>]*>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "") // strip on* handlers
    .replace(/(href|src)\s*=\s*(["']?)\s*javascript:[^"'>\s]*/gi, "$1=$2#"); // neuter js: urls
}
