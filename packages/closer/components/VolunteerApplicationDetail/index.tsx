import Link from 'next/link';

import { ReactNode, useState } from 'react';

import dayjs from 'dayjs';
import { Flag, Lock, Phone } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  VOLUNTEER_HEALTH_RETENTION_DAYS,
  VOLUNTEER_HEAR_ABOUT_US_OPTIONS,
} from '../../constants/volunteerApplication';
import type { VolunteerInfo } from '../../types/booking';
import type { Project } from '../../types/api';
import { hasFlaggedHealthAnswers } from '../../utils/volunteerApplication.helpers';
import Modal from '../Modal';
import Tag from '../Tag';
import BookingSurface from '../booking/bookingSurface';
import { Button } from '../ui';
import Heading from '../ui/Heading';
import HeadingRow from '../ui/HeadingRow';

interface Props {
  volunteerInfo: VolunteerInfo;
  projects?: Project[];
  /**
   * Health answers are special category data (GDPR Art. 9) — only space hosts
   * and admins ever see them.
   */
  canViewHealth: boolean;
  applicantEmail?: string;
  applicantName?: string;
  onRequestCall?: (message: string) => Promise<void>;
}

const Row = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => (
  <div className="flex flex-col gap-1 py-2 border-b border-line last:border-b-0">
    <span className="text-xs uppercase tracking-wide text-complimentary-light">
      {label}
    </span>
    <div className="text-sm whitespace-pre-line break-words">
      {children || <span className="text-complimentary-light">—</span>}
    </div>
  </div>
);

const VolunteerApplicationDetail = ({
  volunteerInfo,
  projects,
  canViewHealth,
  applicantEmail,
  applicantName,
  onRequestCall,
}: Props) => {
  const t = useTranslations();
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [callMessage, setCallMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [callError, setCallError] = useState<string | null>(null);

  const application = volunteerInfo.application;
  const about = application?.about;
  const experience = application?.experience;
  const health = application?.health;
  const agreement = application?.agreement;
  const review = application?.review;
  const isFlagged = hasFlaggedHealthAnswers(volunteerInfo);

  const hearAboutUsLabel = about?.hearAboutUs
    ? about.hearAboutUs === 'other'
      ? about.hearAboutUsOther
      : t(
          VOLUNTEER_HEAR_ABOUT_US_OPTIONS.find(
            (option) => option.value === about.hearAboutUs,
          )?.labelKey || 'volunteer_application_hear_other',
        )
    : '';

  const yesNo = (value: string | undefined) =>
    value === 'yes'
      ? t('volunteer_application_yes')
      : value === 'no'
        ? t('volunteer_application_no')
        : '';

  const handleRequestCall = async () => {
    if (!onRequestCall) return;
    setIsSaving(true);
    setCallError(null);
    try {
      await onRequestCall(callMessage);
      setIsCallModalOpen(false);
    } catch (error) {
      setCallError(
        error instanceof Error
          ? error.message
          : t('volunteer_application_request_call_error'),
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="flex flex-col gap-4">
      <HeadingRow>
        {volunteerInfo.bookingType === 'residence'
          ? t('projects_residence_application_title')
          : t('projects_volunteer_application_title')}
      </HeadingRow>

      <div className="flex flex-wrap gap-2 items-center">
        {review?.status && (
          <Tag color="primary" size="small">
            {t(`volunteer_application_review_status_${review.status}`)}
          </Tag>
        )}
        {canViewHealth && isFlagged && (
          <span className="inline-flex items-center gap-1 text-sm text-accent">
            <Flag className="w-4 h-4" aria-hidden="true" />
            {t('volunteer_application_health_flag')}
          </span>
        )}
      </div>

      {onRequestCall && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            className="w-auto"
            onClick={() => setIsCallModalOpen(true)}
          >
            <span className="inline-flex items-center gap-2">
              <Phone className="w-4 h-4" aria-hidden="true" />
              {t('volunteer_application_request_call')}
            </span>
          </Button>
        </div>
      )}

      {about && (
        <BookingSurface tone="soft" padding="md">
          <Heading level={4} className="!mt-0 text-base mb-2">
            {t('volunteer_application_step_about_title')}
          </Heading>
          <Row label={t('volunteer_application_full_name')}>
            {about.fullName}
          </Row>
          <Row label={t('volunteer_application_nationality')}>
            {about.nationality}
          </Row>
          <Row label={t('volunteer_application_age_range')}>
            {about.ageRange}
          </Row>
          <Row label={t('volunteer_application_phone')}>
            {about.phone && <Link href={`tel:${about.phone}`}>{about.phone}</Link>}
          </Row>
          <Row label={t('volunteer_application_email')}>
            {applicantEmail && (
              <Link href={`mailto:${applicantEmail}`}>{applicantEmail}</Link>
            )}
          </Row>
          <Row label={t('volunteer_application_emergency_contact_title')}>
            {[
              about.emergencyContactName,
              about.emergencyContactPhone,
              about.emergencyContactRelationship,
            ]
              .filter(Boolean)
              .join(' · ')}
          </Row>
          <Row label={t('volunteer_application_insurance')}>
            {yesNo(about.hasInsurance)}
          </Row>
          <Row label={t('volunteer_application_hear_about_us')}>
            {hearAboutUsLabel}
          </Row>
        </BookingSurface>
      )}

      <BookingSurface tone="soft" padding="md">
        <Heading level={4} className="!mt-0 text-base mb-2">
          {t('volunteer_application_step_experience_title')}
        </Heading>
        {experience && (
          <>
            <Row label={t('volunteer_application_volunteered_before_short')}>
              {[yesNo(experience.hasVolunteeredBefore), experience.previousStay]
                .filter(Boolean)
                .join(' — ')}
            </Row>
            <Row label={t('volunteer_application_hoping_to_gain')}>
              {experience.hopingToGain}
            </Row>
            <Row label={t('volunteer_application_challenges')}>
              {experience.anticipatedChallenges}
            </Row>
            <Row label={t('volunteer_application_self_care')}>
              {experience.selfCarePractices}
            </Row>
          </>
        )}
        <Row label={t('projects_skills_and_qualifications_title')}>
          {volunteerInfo.skills?.length ? (
            <span className="flex flex-wrap gap-2">
              {volunteerInfo.skills.map((skill) => (
                <Tag color="primary" size="small" key={skill}>
                  {skill}
                </Tag>
              ))}
            </span>
          ) : null}
        </Row>
        <Row label={t('projects_food_title')}>
          {volunteerInfo.diet?.length ? (
            <span className="flex flex-wrap gap-2">
              {volunteerInfo.diet.map((diet) => (
                <Tag color="primary" size="small" key={diet}>
                  {diet}
                </Tag>
              ))}
            </span>
          ) : null}
        </Row>
        {/* No longer collected, but older applications still carry it. */}
        {volunteerInfo.suggestions && (
          <Row label={t('projects_suggestions_title')}>
            {volunteerInfo.suggestions}
          </Row>
        )}
        {volunteerInfo.projectId && volunteerInfo.projectId.length > 0 && (
          <Row label={t('projects_build_title')}>
            <span className="flex flex-col gap-1">
              {volunteerInfo.projectId.map((projectId) => {
                const project = projects?.find(
                  (item) => item._id === projectId,
                );
                return (
                  <Link
                    key={projectId}
                    href={`/projects/${project?.slug ?? projectId}`}
                  >
                    {project?.name ?? projectId}
                  </Link>
                );
              })}
            </span>
          </Row>
        )}
      </BookingSurface>

      {health &&
        (canViewHealth ? (
          <BookingSurface tone="soft" padding="md">
            <Heading level={4} className="!mt-0 text-base mb-1">
              {t('volunteer_application_step_health_title')}
            </Heading>
            <p className="text-xs text-complimentary-light mb-2 inline-flex items-center gap-1">
              <Lock className="w-3 h-3" aria-hidden="true" />
              {t('volunteer_application_health_restricted_note', {
                days: VOLUNTEER_HEALTH_RETENTION_DAYS,
              })}
            </p>
            <Row label={t('volunteer_application_physical_conditions')}>
              {[
                yesNo(health.hasPhysicalConditions),
                health.physicalConditionsDetails,
              ]
                .filter(Boolean)
                .join(' — ')}
            </Row>
            <Row label={t('volunteer_application_mental_health')}>
              {[
                yesNo(health.isTreatedForMentalHealth),
                health.mentalHealthDetails,
              ]
                .filter(Boolean)
                .join(' — ')}
            </Row>
            <Row label={t('volunteer_application_medication')}>
              {[yesNo(health.takesMedication), health.medicationDetails]
                .filter(Boolean)
                .join(' — ')}
            </Row>
            <Row label={t('volunteer_application_allergies')}>
              {health.allergies}
            </Row>
            <Row label={t('volunteer_application_health_consent_label')}>
              {health.consentedAt
                ? dayjs(health.consentedAt).format('DD/MM/YYYY HH:mm')
                : ''}
            </Row>
          </BookingSurface>
        ) : (
          <BookingSurface tone="soft" padding="md">
            <p className="text-sm text-complimentary-light inline-flex items-center gap-2">
              <Lock className="w-4 h-4" aria-hidden="true" />
              {t('volunteer_application_health_hidden')}
            </p>
          </BookingSurface>
        ))}

      {agreement?.acceptedAt && (
        <BookingSurface tone="soft" padding="md">
          <Heading level={4} className="!mt-0 text-base mb-2">
            {t('volunteer_application_step_agreement_title')}
          </Heading>
          <Row label={t('volunteer_application_agreement_accepted_at')}>
            {dayjs(agreement.acceptedAt).format('DD/MM/YYYY HH:mm')}
          </Row>
          <Row label={t('volunteer_application_agreement_version')}>
            {agreement.version}
          </Row>
        </BookingSurface>
      )}

      {isCallModalOpen && (
        <Modal closeModal={() => setIsCallModalOpen(false)}>
          <div className="flex flex-col gap-4">
            <Heading level={3}>
              {t('volunteer_application_request_call')}
            </Heading>
            <p className="text-sm text-complimentary-light">
              {t('volunteer_application_request_call_intro', {
                name: applicantName || applicantEmail || '',
              })}
            </p>
            <textarea
              rows={4}
              className="new-input px-4 py-3 rounded-lg w-full"
              value={callMessage}
              placeholder={t('volunteer_application_request_call_placeholder')}
              onChange={(event) => setCallMessage(event.target.value)}
            />
            {callError && <p className="text-error text-sm">{callError}</p>}
            <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
              <Button
                variant="secondary"
                className="sm:w-auto"
                onClick={() => setIsCallModalOpen(false)}
              >
                {t('generic_cancel')}
              </Button>
              <Button
                className="sm:w-auto"
                isLoading={isSaving}
                isEnabled={!isSaving}
                onClick={handleRequestCall}
              >
                {t('volunteer_application_request_call_confirm')}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
};

export default VolunteerApplicationDetail;
