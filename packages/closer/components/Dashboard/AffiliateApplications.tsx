import Link from 'next/link';

import { useCallback, useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';

import { AMBASSADOR_ROLE } from '../../constants/village.constants';
import { usePlatform } from '../../contexts/platform';
import api from '../../utils/api';
import { parseMessageFromError } from '../../utils/common';
import { Button, Card, ErrorMessage, Heading, Spinner } from '../ui';

/** Written by POST /affiliates/apply — everything but these keys is a free-form answer. */
const APPLICATION_META_FIELDS = [
  'reason',
  'status',
  'appliedAt',
  'reviewedBy',
  'reviewedAt',
];

interface AffiliateApplication {
  reason?: string;
  status?: string;
  appliedAt?: string;
  [key: string]: unknown;
}

interface Applicant {
  _id: string;
  screenname?: string;
  email?: string;
  slug?: string;
  roles?: string[];
  affiliateApplication?: AffiliateApplication;
}

const PENDING_FILTER = {
  where: { 'affiliateApplication.status': 'pending' },
  limit: 50,
  sort_by: 'affiliateApplication.appliedAt',
};

/** `applyGrant` sends whatever the form had, so turn `audienceSize` into `Audience size`. */
const humanizeFieldName = (name: string) =>
  name
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .trim()
    .split(/\s+/)
    .map((word, index) => {
      const cased = word === word.toUpperCase() ? word : word.toLowerCase();
      return index === 0
        ? cased.charAt(0).toUpperCase() + cased.slice(1)
        : cased;
    })
    .join(' ');

const formatFieldValue = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.map(formatFieldValue).join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const getExtraAnswers = (application: AffiliateApplication = {}) =>
  Object.entries(application)
    .filter(([key]) => !APPLICATION_META_FIELDS.includes(key))
    .map(([key, value]) => ({
      key,
      label: humanizeFieldName(key),
      value: formatFieldValue(value),
    }))
    .filter(({ value }) => value);

interface Props {
  /** Lets the dashboard refresh its affiliate list once an application is approved. */
  onReviewed?: () => void;
}

const AffiliateApplications = ({ onReviewed }: Props) => {
  const t = useTranslations();
  const { platform }: any = usePlatform();

  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const action = await platform.user.get(PENDING_FILTER, { force: true });
      const rows = action?.results?.toJS?.() ?? [];
      setApplicants(Array.isArray(rows) ? rows : []);
    } catch (err) {
      setError(parseMessageFromError(err));
    } finally {
      setIsLoading(false);
    }
  }, [platform?.user]);

  useEffect(() => {
    if (platform?.user) {
      load();
    }
  }, [load, platform?.user]);

  const review = async (endpoint: 'approve' | 'remove', userId: string) => {
    setReviewingId(userId);
    setError(null);
    try {
      await api.post(`/affiliates/${endpoint}`, { userId });
      if (
        endpoint === 'approve' &&
        process.env.NEXT_PUBLIC_FEATURE_FEDERATION === 'true'
      ) {
        const listedRoles = applicants.find(
          (applicant) => applicant._id === userId,
        )?.roles;
        let roles = Array.isArray(listedRoles) ? listedRoles : undefined;
        if (!roles) {
          const action = await platform.user.getOne(userId, { force: true });
          const fetched = action?.results?.toJS?.();
          if (fetched) {
            roles = Array.isArray(fetched.roles) ? fetched.roles : [];
          }
        }
        if (roles && !roles.includes(AMBASSADOR_ROLE)) {
          await platform.user.patch(userId, {
            roles: roles.concat(AMBASSADOR_ROLE),
          });
        }
      }
      // The reviewed user drops out of the pending list — take it off screen now
      // rather than waiting for the refetch so the button cannot be pressed twice.
      setApplicants((current) =>
        current.filter((applicant) => applicant._id !== userId),
      );
      onReviewed?.();
    } catch (err) {
      setError(parseMessageFromError(err));
    } finally {
      setReviewingId(null);
    }
  };

  if (isLoading) {
    return (
      <section className="flex items-center gap-2 text-sm text-gray-500">
        <Spinner /> {t('affiliate_dashboard_applications_loading')}
      </section>
    );
  }

  if (!applicants.length && !error) {
    return null;
  }

  return (
    <section className="flex flex-col gap-3">
      <Heading level={3} className="text-md uppercase">
        {t('affiliate_dashboard_applications_title')} ({applicants.length})
      </Heading>
      {error && <ErrorMessage error={error} />}
      {applicants.map((applicant) => {
        const application = applicant.affiliateApplication || {};
        const extraAnswers = getExtraAnswers(application);
        const isReviewing = reviewingId === applicant._id;

        return (
          <Card key={applicant._id} className="shadow-md gap-3">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <div>
                <p className="font-bold">
                  {applicant.slug ? (
                    <Link href={`/members/${applicant.slug}`}>
                      {applicant.screenname}
                    </Link>
                  ) : (
                    applicant.screenname
                  )}
                </p>
                <p className="text-sm text-gray-500">{applicant.email}</p>
              </div>
              {application.appliedAt && (
                <p className="text-xs text-gray-500">
                  {t('affiliate_dashboard_applications_applied')}{' '}
                  {String(application.appliedAt).slice(0, 10)}
                </p>
              )}
            </div>

            {application.reason && (
              <div>
                <p className="text-xs uppercase text-gray-500">
                  {t('affiliate_dashboard_applications_reason')}
                </p>
                <p className="whitespace-pre-wrap">{application.reason}</p>
              </div>
            )}

            {extraAnswers.length > 0 && (
              <div className="flex flex-col gap-1">
                {extraAnswers.map(({ key, label, value }) => (
                  <div key={key} className="text-sm">
                    <span className="text-gray-500">{label}: </span>
                    <span className="whitespace-pre-wrap">{value}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button
                size="small"
                variant="secondary"
                isFullWidth={false}
                isEnabled={!isReviewing}
                onClick={() => review('remove', applicant._id)}
              >
                {t('affiliate_dashboard_applications_decline')}
              </Button>
              <Button
                size="small"
                isFullWidth={false}
                isEnabled={!isReviewing}
                isLoading={isReviewing}
                onClick={() => review('approve', applicant._id)}
              >
                {t('affiliate_dashboard_applications_approve')}
              </Button>
            </div>
          </Card>
        );
      })}
    </section>
  );
};

export default AffiliateApplications;
