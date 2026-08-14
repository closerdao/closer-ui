import { OnboardingQuest } from '../../constants/tokenOnboardingQuests';
import { formatCarrots } from '../../utils/tokenOnboarding.helpers';

interface CarrotRailProps {
  quests: OnboardingQuest[];
  completed: string[];
  earned: number;
  total: number;
  label: string;
}

const CarrotRail = ({
  quests,
  completed,
  earned,
  total,
  label,
}: CarrotRailProps) => {
  const doneCount = quests.filter((quest) => completed.includes(quest.id))
    .length;
  const isComplete = doneCount === quests.length;
  // Park the carrot in the middle of the segment being worked on.
  const grazerLeft = Math.min(((doneCount + 0.5) / quests.length) * 100, 98);

  return (
    <div className="mb-6">
      <div className="relative pt-7">
        <span
          className="pointer-events-none absolute top-0 -translate-x-1/2 text-2xl leading-none transition-all duration-500"
          style={{ left: `${grazerLeft}%` }}
          aria-hidden
        >
          🥕
        </span>
        <div className="flex gap-1.5" role="presentation">
          {quests.map((quest, index) => {
            const isDone = completed.includes(quest.id);
            const isCurrent = !isDone && index === doneCount;
            return (
              <span
                key={quest.id}
                className={`h-[7px] flex-1 rounded transition-colors duration-500 ${
                  isDone
                    ? 'bg-accent-light'
                    : isCurrent
                    ? 'bg-accent'
                    : 'bg-neutral'
                }`}
              />
            );
          })}
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2 text-sm text-complimentary-light">
        <span>{label}</span>
        <span
          className={`text-lg font-bold ${
            isComplete ? 'text-accent' : 'text-foreground'
          }`}
        >
          {formatCarrots(earned)} / {formatCarrots(total)} 🥕
        </span>
      </div>
    </div>
  );
};

export default CarrotRail;
