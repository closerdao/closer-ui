import {
  parseSimpleFormattedText,
  renderInlineSegments,
} from '../../utils/simpleFormattedText';

interface Props {
  text: string;
  className?: string;
}

const SimpleFormattedText = ({ text, className = '' }: Props) => {
  const blocks = parseSimpleFormattedText(text);
  if (!blocks.length) return null;

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {blocks.map((block, blockIndex) => {
        if (block.type === 'list') {
          return (
            <ul
              key={`list-${blockIndex}`}
              className="list-disc pl-5 space-y-1 text-inherit"
            >
              {block.items.map((item, itemIndex) => (
                <li key={`item-${blockIndex}-${itemIndex}`}>
                  {renderInlineSegments(item)}
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={`p-${blockIndex}`} className="text-inherit leading-relaxed">
            {renderInlineSegments(block.lines[0])}
          </p>
        );
      })}
    </div>
  );
};

export default SimpleFormattedText;
