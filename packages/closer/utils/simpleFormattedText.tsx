import type { ReactNode } from 'react';

type InlineSegment =
  | { type: 'text'; value: string }
  | { type: 'bold'; children: InlineSegment[] }
  | { type: 'italic'; children: InlineSegment[] }
  | { type: 'link'; href: string; children: InlineSegment[] };

type MarkupKind = 'bold' | 'italic' | 'link';

const URL_SOURCE = '(?:[^\\s()]|\\([^\\s()]*\\))+';
// `//` and `/\` are refused: browsers read both as another host.
const HREF_SOURCE = `(?:https?:\\/\\/|mailto:)${URL_SOURCE}|\\/(?![\\/\\\\])(?:${URL_SOURCE})?|#(?:${URL_SOURCE})?`;
const LINK_PATTERN = new RegExp(
  `\\[([^\\[\\]\\n]+?)\\]\\((${HREF_SOURCE})\\)`,
  'g',
);

const linkAttributes = (href: string): { target?: string; rel?: string } => {
  if (/^https?:/i.test(href)) {
    return { target: '_blank', rel: 'noopener noreferrer' };
  }
  return href.startsWith('mailto:') ? { rel: 'noopener noreferrer' } : {};
};

type EmphasisPattern = {
  kind: 'bold' | 'italic';
  delimiter: string;
  pattern: RegExp;
};
const EMPHASIS_PATTERNS: EmphasisPattern[] = [
  { kind: 'bold', delimiter: '**', pattern: /\*\*(.+?)\*\*/g },
  { kind: 'italic', delimiter: '*', pattern: /\*(.+?)\*/g },
  { kind: 'italic', delimiter: '_', pattern: /_(.+?)_/g },
];

// The label stays as HTML; callers must sanitize the result.
export const linkifyMarkdownInHtml = (html: string): string =>
  html.replace(new RegExp(LINK_PATTERN.source, 'g'), (_match, label, href) => {
    const safeHref = String(href)
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const attrs = Object.entries(linkAttributes(String(href)))
      .map(([name, value]) => ` ${name}="${value}"`)
      .join('');
    return `<a href="${safeHref}"${attrs}>${label}</a>`;
  });

type Span = { index: number; end: number };

const findLinks = (
  line: string,
): Array<Span & { label: string; href: string }> => {
  LINK_PATTERN.lastIndex = 0;
  return Array.from(line.matchAll(LINK_PATTERN), (match) => ({
    index: match.index ?? 0,
    end: (match.index ?? 0) + match[0].length,
    label: match[1],
    href: match[2],
  }));
};

const linkAt = (position: number, links: Span[]) =>
  links.find((link) => position > link.index && position < link.end);

// Emphasis may wrap a link but must not start or end inside one, or a stray
// `_`/`*` before a link would pair with one in its URL.
const nextEmphasis = (
  line: string,
  from: number,
  { pattern, delimiter }: EmphasisPattern,
  links: Span[],
): (Span & { inner: string }) | null => {
  let start = from;
  while (start < line.length) {
    pattern.lastIndex = start;
    const match = pattern.exec(line);
    if (!match) return null;
    start = match.index + 1;
    if (linkAt(match.index, links)) continue;

    let close = match.index + match[0].length - delimiter.length;
    let link = linkAt(close, links);
    while (link && close !== -1) {
      close = line.indexOf(delimiter, link.end);
      link = close === -1 ? undefined : linkAt(close, links);
    }
    if (close === -1) continue;
    return {
      index: match.index,
      end: close + delimiter.length,
      inner: line.slice(match.index + delimiter.length, close),
    };
  }
  return null;
};

const parseInlineSegments = (
  line: string,
  kinds: MarkupKind[],
): InlineSegment[] => {
  const segments: InlineSegment[] = [];
  const links = kinds.includes('link') ? findLinks(line) : [];
  const emphasis = EMPHASIS_PATTERNS.filter(({ kind }) => kinds.includes(kind));
  let from = 0;

  while (from < line.length) {
    let best: { span: Span; segment: InlineSegment } | null = null;

    const link = links.find((candidate) => candidate.index >= from);
    if (link) {
      best = {
        span: link,
        segment: {
          type: 'link',
          href: link.href,
          children: parseInlineSegments(
            link.label,
            kinds.filter((kind) => kind !== 'link'),
          ),
        },
      };
    }
    for (const pattern of emphasis) {
      const { kind } = pattern;
      const match = nextEmphasis(line, from, pattern, links);
      if (match && (!best || match.index < best.span.index)) {
        best = {
          span: match,
          segment: {
            type: kind,
            children: parseInlineSegments(
              match.inner,
              kinds.includes('link') ? ['link'] : [],
            ),
          },
        };
      }
    }

    if (!best) {
      segments.push({ type: 'text', value: line.slice(from) });
      break;
    }
    if (best.span.index > from) {
      segments.push({ type: 'text', value: line.slice(from, best.span.index) });
    }
    segments.push(best.segment);
    from = best.span.end;
  }

  return segments.length ? segments : [{ type: 'text', value: line }];
};

const renderAnchor = (children: ReactNode, href: string, key: number) => (
  <a
    key={key}
    href={href}
    className="underline text-accent"
    {...linkAttributes(href)}
  >
    {children}
  </a>
);

const renderSegment = (segment: InlineSegment, index: number): ReactNode => {
  switch (segment.type) {
    case 'bold':
      return <strong key={index}>{segment.children.map(renderSegment)}</strong>;
    case 'italic':
      return <em key={index}>{segment.children.map(renderSegment)}</em>;
    case 'link':
      return renderAnchor(
        segment.children.map(renderSegment),
        segment.href,
        index,
      );
    case 'text':
      return segment.value;
    default: {
      const exhaustive: never = segment;
      return exhaustive;
    }
  }
};

export const renderInlineSegments = (line: string): ReactNode[] =>
  parseInlineSegments(line, ['bold', 'italic', 'link']).map(renderSegment);

export const renderLinkedText = (
  text: string | null | undefined,
): ReactNode => {
  if (typeof text !== 'string' || !text) return text ?? null;
  const segments = parseInlineSegments(text, ['link']);
  if (segments.length === 1 && segments[0].type === 'text') {
    return segments[0].value;
  }
  return segments.map(renderSegment);
};

export type SimpleFormattedBlock =
  { type: 'paragraph'; lines: string[] } | { type: 'list'; items: string[] };

export const parseSimpleFormattedText = (
  text: string,
): SimpleFormattedBlock[] => {
  const normalized = text.replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];

  const lines = normalized.split('\n');
  const blocks: SimpleFormattedBlock[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length) {
      blocks.push({ type: 'list', items: listItems });
      listItems = [];
    }
  };

  lines.forEach((rawLine) => {
    const line = rawLine.trimEnd();
    const listMatch = line.match(/^-\s+(.*)$/);
    if (listMatch) {
      listItems.push(listMatch[1]);
      return;
    }
    flushList();
    if (line.trim()) {
      blocks.push({ type: 'paragraph', lines: [line] });
    }
  });

  flushList();
  return blocks;
};
