import Head from 'next/head';
import Link from 'next/link';

import FeatureNotEnabled from '../../../components/FeatureNotEnabled';
import Heading from '../../../components/ui/Heading';

import { ArrowLeft } from 'lucide-react';
import { NextApiRequest, NextPageContext } from 'next';
import { useTranslations } from 'next-intl';

import config from '../../../configCached';
import type { Quest, QuestAudit } from '../../../types/quest';
import { parseMessageFromError } from '../../../utils/common';
import { getQuest, getQuestAudit } from '../../../utils/quests.api';
import PageNotFound from '../../not-found';

interface QuestsConfig {
  enabled: boolean;
}

interface Props {
  quest: Quest | null;
  audit: QuestAudit | null;
  questsConfig: QuestsConfig | null;
  error?: string | null;
}

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="py-3 border-t border-gray-200">
    <div className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
      {label}
    </div>
    <div className="text-sm break-all mt-1">{value}</div>
  </div>
);

const QuestAuditPage = ({ quest, audit, questsConfig, error }: Props) => {
  const t = useTranslations();

  if (questsConfig?.enabled === false) {
    return <FeatureNotEnabled feature="quests" />;
  }

  if (!quest) {
    return <PageNotFound error={error || undefined} />;
  }

  const tickets = audit?.tickets || [];
  // The frozen list is one row per ticket, so fold it into who holds how many.
  const byMember = tickets.reduce<
    Record<string, { name: string; count: number }>
  >((acc, ticket) => {
    const key = ticket.userId;
    const name = ticket.screenname || ticket.slug || ticket.userId;
    acc[key] = { name, count: (acc[key]?.count || 0) + 1 };
    return acc;
  }, {});
  const holders = Object.entries(byMember).sort(
    ([, a], [, b]) => b.count - a.count,
  );

  return (
    <>
      <Head>
        <title>{`${t('quests_audit_title')} — ${quest.title}`}</title>
      </Head>

      <div className="main-content w-full mb-12">
        <Link
          href={`/quests/${quest.slug}`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {quest.title}
        </Link>

        <Heading level={1} className="mb-2">
          {t('quests_audit_title')}
        </Heading>
        <p className="text-gray-500 mb-6 max-w-2xl">
          {t('quests_audit_intro')}
        </p>

        {!audit ? (
          <p className="italic text-gray-500">
            {error || t('quests_audit_unavailable')}
          </p>
        ) : (
          <div className="max-w-2xl">
            {audit.ticketsHash && (
              <Row label={t('quests_winners_hash')} value={audit.ticketsHash} />
            )}
            {audit.drawSeed && (
              <Row label={t('quests_winners_seed')} value={audit.drawSeed} />
            )}
            {audit.derivation && (
              <Row
                label={t('quests_audit_derivation')}
                value={audit.derivation}
              />
            )}
            <Row
              label={t('quests_audit_ticket_count')}
              value={String(tickets.length)}
            />

            {audit.winners?.length ? (
              <div className="py-3 border-t border-gray-200">
                <div className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                  {t('quests_winners_title')}
                </div>
                <ul className="text-sm flex flex-col gap-1">
                  {audit.winners.map((winner) => (
                    <li key={`${winner.rank}-${winner.userId}`}>
                      #{winner.rank} —{' '}
                      {winner.screenname || winner.slug || winner.userId}
                      {typeof winner.ticketIndex === 'number' && (
                        <span className="text-gray-500">
                          {' '}
                          ({t('quests_audit_ticket_index')} {winner.ticketIndex}
                          )
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {holders.length > 0 && (
              <div className="py-3 border-t border-gray-200">
                <div className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                  {t('quests_audit_holders')}
                </div>
                <ul className="text-sm flex flex-col gap-1">
                  {holders.map(([userId, holder]) => (
                    <li key={userId} className="flex justify-between gap-4">
                      <span className="truncate">{holder.name}</span>
                      <span className="tabular-nums shrink-0">
                        {holder.count}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

QuestAuditPage.getInitialProps = async (context: NextPageContext) => {
  const { req, query } = context;
  try {
    const slug = String(query.slug);
    const [quest, audit] = await Promise.all([
      getQuest(slug, { req: req as NextApiRequest }),
      // 409 until the quest is locked, which is a normal state here.
      getQuestAudit(slug, { req: req as NextApiRequest }).catch(() => null),
    ]);
    return {
      quest,
      audit,
      questsConfig: config.quests || null,
      error: null,
    };
  } catch (err: unknown) {
    return {
      quest: null,
      audit: null,
      questsConfig: config.quests || null,
      error: parseMessageFromError(err),
    };
  }
};

export default QuestAuditPage;
