import { Fragment } from 'react';

/** `**bold**` and `` `code` `` — the only markup the quest copy uses. */
const INLINE_PATTERN = /(\*\*[^*]+\*\*|`[^`]+`)/g;

const InlineText = ({ text }: { text: string }) => (
  <>
    {text
      .split(INLINE_PATTERN)
      .filter((part) => part !== '')
      .map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={index} className="font-bold">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code
              key={index}
              className="rounded bg-neutral px-1 py-0.5 text-sm font-mono"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        return <Fragment key={index}>{part}</Fragment>;
      })}
  </>
);

export default InlineText;
