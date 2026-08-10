import { useState } from 'react';

import { ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslations } from 'next-intl';

import type { AgentKnowledgeEntry } from '../../types/agentChat';

type Props = {
  knowledge: AgentKnowledgeEntry[];
};

const AgentChatKnowledge = ({ knowledge }: Props) => {
  const t = useTranslations();
  const [expanded, setExpanded] = useState(false);

  if (!knowledge.length) return null;

  return (
    <div className="mt-2 border-t border-line/15 pt-2">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900"
      >
        {expanded ? (
          <ChevronUp className="h-3.5 w-3.5" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5" />
        )}
        {t('agent_chat_sources', { count: knowledge.length })}
      </button>
      {expanded && (
        <ul className="mt-2 flex flex-col gap-2">
          {knowledge.map((entry) => (
            <li
              key={entry.slug}
              className="rounded-lg border border-line/15 bg-white/80 px-3 py-2 text-xs"
            >
              <p className="font-medium text-gray-900">{entry.title}</p>
              <p className="mt-0.5 text-gray-800">{entry.value}</p>
              {entry.summary ? (
                <p className="mt-1 text-gray-500">{entry.summary}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AgentChatKnowledge;
