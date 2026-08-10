import type { AgentChatMessageMeta } from '../../types/agentChat';

type Props = {
  meta?: AgentChatMessageMeta;
};

const AgentChatMessageMetaDisplay = ({ meta }: Props) => {
  const intent = meta?.intent?.trim();
  const domains =
    meta?.domains?.map((d) => d.trim()).filter((d) => d.length > 0) ?? [];

  if (!intent && domains.length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-line/10 pt-2">
      {intent ? (
        <span className="rounded-md bg-neutral-light px-2 py-0.5 font-mono text-[11px] text-gray-700">
          {intent}
        </span>
      ) : null}
      {domains.map((domain) => (
        <span
          key={domain}
          className="rounded-md border border-line/15 bg-white px-2 py-0.5 text-[11px] text-gray-600"
        >
          {domain}
        </span>
      ))}
    </div>
  );
};

export default AgentChatMessageMetaDisplay;
