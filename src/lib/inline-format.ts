export type InlineSpan =
  | { kind: 'text'; text: string }
  | { kind: 'bold'; text: string }
  | { kind: 'italic'; text: string }
  | { kind: 'link'; text: string; url: string };

const TOKEN = /(\*\*[^*\n]+\*\*|_[^_\n]+_|\[[^\]\n]+\]\(https?:\/\/[^)\s]+\))/g;

/**
 * Minimal inline markup for story paragraphs: **bold**, _italic_ and [text](https://url).
 * Anything that doesn't match exactly stays plain text, so stray symbols are harmless.
 */
export function parseInline(text: string): InlineSpan[] {
  const spans: InlineSpan[] = [];
  let last = 0;
  for (const match of text.matchAll(TOKEN)) {
    const token = match[0];
    const start = match.index ?? 0;
    if (start > last) spans.push({ kind: 'text', text: text.slice(last, start) });
    if (token.startsWith('**')) spans.push({ kind: 'bold', text: token.slice(2, -2) });
    else if (token.startsWith('_')) spans.push({ kind: 'italic', text: token.slice(1, -1) });
    else {
      const close = token.indexOf('](');
      spans.push({ kind: 'link', text: token.slice(1, close), url: token.slice(close + 2, -1) });
    }
    last = start + token.length;
  }
  if (last < text.length) spans.push({ kind: 'text', text: text.slice(last) });
  return spans;
}

/** Plain text with markup removed, e.g. for character counts and validation. */
export function stripInline(text: string): string {
  return parseInline(text)
    .map((s) => s.text)
    .join('');
}
