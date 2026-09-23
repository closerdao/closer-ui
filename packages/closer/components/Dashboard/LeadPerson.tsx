import Link from 'next/link';

import { ReactNode, useCallback, useState } from 'react';

import dayjs from 'dayjs';
import { Check, Copy } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Lead } from '../../types/lead';
import {
  isHttpUrl,
  leadApplicationAnswers,
  leadPersonEmail,
  leadPersonName,
  leadProfileLinks,
  leadResearchLinks,
} from '../../utils/leads.helpers';
import { POSTHOG_NO_CAPTURE_CLASS } from '../../utils/posthog';
import ExternalLinkDisplay from '../display/externalLinkDisplay';

interface Props {
  lead: Lead;
}

const CopyButton = ({ value, label }: { value: string; label: string }) => {
  const t = useTranslations();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!value || typeof navigator === 'undefined' || !navigator.clipboard) {
        return;
      }
      try {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      } catch {
        setCopied(false);
      }
    },
    [value],
  );

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="shrink-0 rounded p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors inline-flex items-center"
      title={
        copied
          ? t('dashboard_leads_person_copied')
          : t('dashboard_leads_person_copy', { label })
      }
      aria-label={
        copied
          ? t('dashboard_leads_person_copied')
          : t('dashboard_leads_person_copy', { label })
      }
    >
      {copied ? (
        <Check size={14} className="text-green-600" />
      ) : (
        <Copy size={14} />
      )}
    </button>
  );
};

const Row = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex flex-wrap gap-x-2 text-sm">
    <span className="text-gray-500 shrink-0">{label}</span>
    <span className="text-gray-900 break-words min-w-0">{children}</span>
  </div>
);

/**
 * Everything we already know about the person behind a lead, gathered in one
 * place under the header — because the first question anyone asks about a cold
 * lead is whether they are real, and until now the answer took a search on
 * another site.
 *
 * Nothing here is fetched. The application's own answers and the account arrive
 * expanded on the lead and were simply not being drawn; the research links are
 * prefilled searches, not lookups. So the block costs nothing to render and is
 * empty for a lead that genuinely has nothing behind it.
 */
const LeadPerson = ({ lead }: Props) => {
  const t = useTranslations();
  const answers = leadApplicationAnswers(lead);
  const profileLinks = leadProfileLinks(lead);
  const research = leadResearchLinks(lead);
  const user = lead.user;
  const name = leadPersonName(lead);
  const email = leadPersonEmail(lead);
  const application = lead.applications?.[0];
  // `created` on the account, else the date they applied: either one answers
  // "how long have they been around", which is the point of showing it.
  const since = user?.created || application?.created;

  const hasProfile = Boolean(
    user?.slug || since || profileLinks.length > 0 || user?.about?.trim(),
  );
  if (
    !hasProfile &&
    answers.length === 0 &&
    research.length === 0 &&
    !name &&
    !email
  ) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3" data-testid="lead-person">
      {(name || email) && (
        <div className="flex flex-col gap-1.5 pb-2 border-b border-gray-100">
          {name && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500 shrink-0">
                {t('dashboard_leads_person_name')}:
              </span>
              <span
                className={`font-medium text-gray-900 break-words ${POSTHOG_NO_CAPTURE_CLASS}`}
                data-ph-mask
              >
                {name}
              </span>
              <CopyButton
                value={name}
                label={t('dashboard_leads_person_name')}
              />
            </div>
          )}
          {email && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500 shrink-0">
                {t('dashboard_leads_person_email')}:
              </span>
              <span
                className={`text-gray-900 break-all ${POSTHOG_NO_CAPTURE_CLASS}`}
                data-ph-mask
              >
                {email}
              </span>
              <CopyButton
                value={email}
                label={t('dashboard_leads_person_email')}
              />
            </div>
          )}
        </div>
      )}
      {answers.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500">
            {t('dashboard_leads_person_answers')}
          </span>
          {answers.map((answer) => (
            <Row key={`${lead._id}-answer-${answer.key}`} label={answer.label}>
              {isHttpUrl(answer.value) ? (
                <ExternalLinkDisplay href={answer.value} />
              ) : (
                answer.value
              )}
            </Row>
          ))}
        </div>
      )}

      {hasProfile && (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500">
            {t('dashboard_leads_person_account')}
          </span>
          {since ? (
            // dayjs, not toLocaleDateString: the board renders on the server
            // first and a locale-formatted date there breaks hydration.
            <Row label={t('dashboard_leads_person_since')}>
              {dayjs(since).format('D MMM YYYY')}
            </Row>
          ) : null}
          {user?.subscription?.plan ? (
            <Row label={t('dashboard_leads_person_plan')}>
              {user.subscription.plan}
            </Row>
          ) : null}
          {user?.about?.trim() ? (
            <Row label={t('dashboard_leads_person_about')}>{user.about}</Row>
          ) : null}
          {profileLinks.length > 0 ? (
            <Row label={t('dashboard_leads_person_links')}>
              <span className="flex flex-wrap gap-x-3">
                {profileLinks.map((link) => (
                  <ExternalLinkDisplay
                    key={`${lead._id}-link-${link.url}`}
                    href={link.url}
                  />
                ))}
              </span>
            </Row>
          ) : null}
          {user?.slug ? (
            <Link
              href={`/members/${user.slug}`}
              className="text-sm text-accent underline w-fit"
            >
              {t('dashboard_leads_person_profile')}
            </Link>
          ) : null}
        </div>
      )}

      {research.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500">
            {t('dashboard_leads_person_research')}
          </span>
          <p className="text-xs text-gray-500">
            {t('dashboard_leads_person_research_hint')}
          </p>
          <div className="flex flex-wrap gap-2">
            {research.map((link) => (
              <a
                key={`${lead._id}-research-${link.key}`}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="text-xs rounded-full px-2.5 py-1 border border-gray-300 text-gray-700 hover:border-gray-500 transition-colors"
              >
                {t(`dashboard_leads_person_research_${link.key}`, { name })}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadPerson;
