import { OnboardingBlock } from '../../constants/tokenOnboardingQuests';
import InlineText from './InlineText';

const QuestBody = ({ blocks }: { blocks: OnboardingBlock[] }) => (
  <div className="flex flex-col gap-3 text-base leading-relaxed">
    {blocks.map((block, index) => {
      switch (block.type) {
        case 'p':
          return (
            <p key={index} className="max-w-[62ch]">
              <InlineText text={block.text} />
            </p>
          );

        case 'subheading':
          return (
            <h4
              key={index}
              className="mt-2 text-sm font-bold uppercase tracking-wider text-complimentary-light"
            >
              {block.text}
            </h4>
          );

        case 'list':
          return (
            <ul
              key={index}
              className="max-w-[62ch] list-disc pl-5 marker:text-accent"
            >
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex} className="mb-1.5">
                  <InlineText text={item} />
                </li>
              ))}
            </ul>
          );

        case 'steps':
          return (
            <ol key={index} className="max-w-[62ch] flex flex-col gap-3">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex} className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-accent-light text-sm font-bold text-accent-core">
                    {itemIndex + 1}
                  </span>
                  <span>
                    <InlineText text={item} />
                  </span>
                </li>
              ))}
            </ol>
          );

        case 'note':
          return (
            <div
              key={index}
              className={`max-w-[62ch] rounded-r-lg border-l-[3px] px-4 py-3 ${
                block.tone === 'warn'
                  ? 'border-pending bg-pending/10'
                  : 'border-accent bg-accent-light/40'
              }`}
            >
              <InlineText text={block.text} />
            </div>
          );

        case 'facts':
          return (
            <div key={index} className="flex flex-wrap gap-2.5">
              {block.items.map((fact, factIndex) => (
                <div
                  key={factIndex}
                  className="flex-1 basis-[150px] rounded-lg border border-line/40 px-4 py-3"
                >
                  <span className="block text-xs font-bold uppercase tracking-widest text-complimentary-light">
                    {fact.label}
                  </span>
                  <span className="block text-lg font-bold">{fact.value}</span>
                </div>
              ))}
            </div>
          );

        default:
          return null;
      }
    })}
  </div>
);

export default QuestBody;
