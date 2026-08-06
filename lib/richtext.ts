
export function sanitizeRichText(html: string): string {
  if (!html) return "";
  return html
    .replace(/<\/?(script|style|iframe|object|embed|link|meta|form|input|svg)\b[^>]*>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "") // strip on* handlers
    .replace(/(href|src)\s*=\s*(["']?)\s*javascript:[^"'>\s]*/gi, "$1=$2#"); // neuter js: urls
}
