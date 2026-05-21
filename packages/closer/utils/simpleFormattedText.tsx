import type { ReactNode } from 'react';

type InlineSegment =
  | { type: 'text'; value: string }
  | { type: 'bold'; value: string }
  | { type: 'italic'; value: string };

const parseInlineSegments = (line: string): InlineSegment[] => {
  const segments: InlineSegment[] = [];
  const pattern = /(\*\*(.+?)\*\*|\*(.+?)\*|_(.+?)_)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(line)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: line.slice(lastIndex, match.index) });
    }
    if (match[2] !== undefined) {
      segments.push({ type: 'bold', value: match[2] });
    } else if (match[3] !== undefined) {
      segments.push({ type: 'italic', value: match[3] });
    } else if (match[4] !== undefined) {
      segments.push({ type: 'italic', value: match[4] });
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < line.length) {
    segments.push({ type: 'text', value: line.slice(lastIndex) });
  }

  return segments.length ? segments : [{ type: 'text', value: line }];
};

export const renderInlineSegments = (line: string): ReactNode[] =>
  parseInlineSegments(line).map((segment, index) => {
    switch (segment.type) {
      case 'bold':
        return <strong key={index}>{segment.value}</strong>;
      case 'italic':
        return <em key={index}>{segment.value}</em>;
      default:
        return segment.value;
    }
  });

export type SimpleFormattedBlock =
  | { type: 'paragraph'; lines: string[] }
  | { type: 'list'; items: string[] };

export const parseSimpleFormattedText = (text: string): SimpleFormattedBlock[] => {
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
