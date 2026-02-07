/**
 * Converts HTML content to readable plain text.
 * Strips scripts, styles, and non-content elements.
 * Converts headings, links, lists, and images to text equivalents.
 */
export function htmlToText(html: string): string {
  return (
    html
      // Remove scripts, styles, and non-content elements
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
      .replace(/<svg[\s\S]*?<\/svg>/gi, "")
      .replace(/<nav[\s\S]*?<\/nav>/gi, "[Navigation]\n")
      .replace(/<footer[\s\S]*?<\/footer>/gi, "[Footer]\n")
      .replace(/<header[\s\S]*?<\/header>/gi, "")
      // Convert common elements to text
      .replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, "\n## $1\n")
      .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, "\n$1\n")
      .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "- $1\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, "$2 ($1)")
      .replace(/<img[^>]*alt="([^"]*)"[^>]*\/?>/gi, "[Image: $1]")
      .replace(/<[^>]+>/g, "")
      // Clean up entities
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&[a-z]+;/gi, "")
      // Clean up whitespace
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]+/g, " ")
      .trim()
  );
}
