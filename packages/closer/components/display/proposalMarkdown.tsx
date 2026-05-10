import type { Components } from 'react-markdown';

import ExternalLinkDisplay from './externalLinkDisplay';
import RichMarkdownChildren from './richMarkdownChildren';

export const proposalMarkdownComponents: Components = {
  p: ({ children }) => (
    <p className="mb-2 min-w-0 max-w-full break-words last:mb-0">
      <RichMarkdownChildren>{children}</RichMarkdownChildren>
    </p>
  ),
  a: ({ href, children }) => {
    if (!href) {
      return (
        <span className="break-words">
          <RichMarkdownChildren>{children}</RichMarkdownChildren>
        </span>
      );
    }
    if (/^mailto:/i.test(href)) {
      const addr = href.replace(/^mailto:/i, '').trim();
      return (
        <a
          href={href}
          className="inline-flex max-w-full min-w-0 text-accent underline"
          title={addr}
        >
          <span className="inline-flex min-w-0 max-w-full truncate">
            <RichMarkdownChildren>{children}</RichMarkdownChildren>
          </span>
        </a>
      );
    }
    return (
      <ExternalLinkDisplay href={href} className="break-all">
        <RichMarkdownChildren>{children}</RichMarkdownChildren>
      </ExternalLinkDisplay>
    );
  },
  strong: ({ children }) => (
    <strong className="font-semibold text-gray-900">
      <RichMarkdownChildren>{children}</RichMarkdownChildren>
    </strong>
  ),
  em: ({ children }) => (
    <em className="italic">
      <RichMarkdownChildren>{children}</RichMarkdownChildren>
    </em>
  ),
  ul: ({ children }) => (
    <ul className="mb-2 list-inside list-disc space-y-1 break-words pl-1">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-2 list-inside list-decimal space-y-1 break-words pl-1">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="break-words">
      <RichMarkdownChildren>{children}</RichMarkdownChildren>
    </li>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mb-2 border-l-2 border-gray-300 pl-3 text-gray-700 italic">
      <RichMarkdownChildren>{children}</RichMarkdownChildren>
    </blockquote>
  ),
  pre: ({ children }) => (
    <pre className="mb-2 max-w-full overflow-x-auto rounded-md bg-gray-100 p-3 text-[12px] font-mono">
      {children}
    </pre>
  ),
  code: ({ className, children }) => {
    const isBlock = Boolean(className?.includes('language-'));
    if (isBlock) {
      return <code className={className}>{children}</code>;
    }
    return (
      <code className="break-all rounded bg-gray-200/80 px-1 py-0.5 font-mono text-[12px]">
        {children}
      </code>
    );
  },
};
