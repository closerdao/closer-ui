import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { FormEvent, ReactNode, useEffect, useState } from 'react';

import CommunityMap from '../../components/CommunityMap';
import {
  Eyebrow,
  PageShell,
  btnPrimary,
  btnSecondary,
  inputClass,
  labelClass,
} from '../../components/VillageUI';
import { ErrorMessage, Spinner } from '../../components/ui';

import { useTranslations } from 'next-intl';

import Page401 from '../401';
import { useAuth } from '../../contexts/auth';
import { CreateVillageInput, LatLng, Village } from '../../types/village';
import api from '../../utils/api';
import {
  clearApplicationAnswers,
  readApplicationAnswers,
  storedApplicationToVillageInitial,
} from '../../utils/applicationAnswersStorage';
import { isSubscriptionActive } from '../../utils/subscriptions.helpers';
import {
  createVillage,
  fetchVillageCreatedBy,
  toLeafletCoords,
} from '../../utils/village.utils';

const DESCRIPTION_MAX = 600;

const GateCard = ({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children: ReactNode;
}) => (
  <div className="rounded-[22px] border border-[#C2F0DA] bg-white p-8 md:p-12 text-center">
    <div className="w-14 h-14 rounded-full bg-[#E2FAEE] text-[#0FA968] text-2xl flex items-center justify-center mx-auto">
      ✦
    </div>
    <h1 className="font-serif text-3xl md:text-4xl mt-6">{title}</h1>
    <p className="text-[15px] text-[#5C6E64] mt-4 max-w-md mx-auto leading-relaxed">
      {body}
    </p>
    <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
      {children}
    </div>
  </div>
);

/**
 * A deliberately small cousin of `VillageForm`: the launcher already told us
 * most of their story in the application, so the page only asks for what a map
 * pin cannot live without — a name, a country, a few sentences, and the pin
 * itself. Anything else the application carried (website, tags, contact) rides
 * along in the payload without a field. Reads `initial` once, at mount.
 */
const LaunchVillageForm = ({
  initial,
  onSubmit,
}: {
  initial: Partial<Village> | null;
  onSubmit: (payload: CreateVillageInput) => Promise<void>;
}) => {
  const t = useTranslations();
  const [name, setName] = useState(initial?.name || '');
  const [country, setCountry] = useState(initial?.country || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [pickedCoords, setPickedCoords] = useState<LatLng | null>(
    toLeafletCoords(initial?.coords),
  );
  const [invalidFields, setInvalidFields] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // Country picks from the same list the application modal offers. While the
  // list is loading — or if it never arrives — the field stays a text input,
  // so the form never blocks on the metadata endpoint.
  const [countries, setCountries] = useState<string[]>([]);

  useEffect(() => {
    let isCurrent = true;
    api
      .get('/meta/countries')
      .then((res) => {
        if (!isCurrent) return;
        const names = (res.data?.results || [])
          .map((item: { name?: string }) => item?.name)
          .filter(Boolean) as string[];
        setCountries(names);
      })
      .catch(() => {});
    return () => {
      isCurrent = false;
    };
  }, []);

  // Frozen at mount, like VillageForm: picking a pin must not move the view.
  const [initialView] = useState(() =>
    pickedCoords
      ? { center: pickedCoords, zoom: 8 }
      : { center: [40, 0] as LatLng, zoom: 3 },
  );

  const fieldClass = (field: string) =>
    `${inputClass} ${
      invalidFields.includes(field) ? '!border-[#DB4726] bg-[#FEF6F4]' : ''
    }`;

  const clearInvalid = (field: string) =>
    setInvalidFields((prev) => prev.filter((item) => item !== field));

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    const missing: string[] = [];
    if (!name.trim()) missing.push('name');
    if (!country.trim()) missing.push('country');
    if (!description.trim()) missing.push('description');
    if (!pickedCoords) missing.push('coords');
    if (missing.length > 0) {
      setInvalidFields(missing);
      setError(t('villages_form_error_required'));
      return;
    }
    setInvalidFields([]);

    const payload: CreateVillageInput = {
      name: name.trim(),
      country: country.trim(),
      description: description.trim(),
      coords: pickedCoords as LatLng,
      status: 'planning',
      // What the application knew but the short form never asks for.
      ...(initial?.website ? { website: initial.website } : {}),
      ...(initial?.tags?.length ? { tags: initial.tags } : {}),
      ...(initial?.contact ? { contact: initial.contact } : {}),
      ...(initial?.onboardingStatus
        ? { onboardingStatus: initial.onboardingStatus }
        : {}),
    };

    try {
      setIsLoading(true);
      await onSubmit(payload);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('villages_form_error_save'),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-[#C2F0DA] rounded-[22px] p-6 md:p-8 flex flex-col gap-5 shadow-[0_10px_30px_rgba(15,169,104,0.06)]"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <label className="flex flex-col gap-2">
          <span className={labelClass}>{t('villages_form_name')} *</span>
          <input
            className={fieldClass('name')}
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              clearInvalid('name');
            }}
            placeholder={t('villages_form_name_placeholder')}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className={labelClass}>{t('villages_form_country')} *</span>
          {countries.length > 0 ? (
            <select
              className={fieldClass('country')}
              value={country}
              onChange={(event) => {
                setCountry(event.target.value);
                clearInvalid('country');
              }}
            >
              <option value="">
                {t('village_launch_country_placeholder')}
              </option>
              {/* A pre-filled country the list doesn't know must stay
                  selectable rather than silently blanking the field. */}
              {country && !countries.includes(country) ? (
                <option value={country}>{country}</option>
              ) : null}
              {countries.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ) : (
            <input
              className={fieldClass('country')}
              value={country}
              onChange={(event) => {
                setCountry(event.target.value);
                clearInvalid('country');
              }}
              placeholder={t('villages_form_country_placeholder')}
            />
          )}
        </label>
      </div>

      <label className="flex flex-col gap-2">
        <span className={labelClass}>
          {t('village_launch_description_label')} *
        </span>
        <textarea
          className={`${fieldClass(
            'description',
          )} min-h-[110px] resize-y leading-relaxed`}
          value={description}
          maxLength={DESCRIPTION_MAX}
          onChange={(event) => {
            setDescription(event.target.value);
            clearInvalid('description');
          }}
          placeholder={t('villages_form_description_placeholder')}
        />
      </label>

      <div className="flex flex-col gap-2">
        <span className={labelClass}>{t('villages_form_location_title')} *</span>
        <div
          className={`relative rounded-[18px] overflow-hidden border ${
            invalidFields.includes('coords')
              ? 'border-[#DB4726]'
              : 'border-[#C2F0DA]'
          }`}
        >
          <div className="h-[300px]">
            <CommunityMap
              isPicker
              pickedCoords={pickedCoords}
              onPick={(coords: LatLng) => {
                setPickedCoords(coords);
                clearInvalid('coords');
              }}
              center={initialView.center}
              zoom={initialView.zoom}
              scrollWheelZoom
            />
          </div>
          {!pickedCoords ? (
            <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center z-[2]">
              <span className="rounded-full bg-white/95 border border-[#C2F0DA] px-4 py-2 text-[13px] font-semibold text-[#0B7A4C] shadow-sm">
                {t('villages_form_location_hint')}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {error ? <ErrorMessage error={error} /> : null}

      <button
        type="submit"
        className={`${btnPrimary} w-full sm:w-auto sm:self-start`}
        disabled={isLoading}
      >
        {isLoading
          ? t('village_launch_submitting')
          : t('village_launch_submit')}
      </button>
    </form>
  );
};

/**
 * Where a subscribed member launches their own village. One per member — a
 * second visit lands on their existing village — and the form opens pre-filled
 * with whatever they told us in the "apply to join" modal, which
 * `ApplicationModal` leaves in localStorage for exactly this moment.
 */
const LaunchVillagePage = () => {
  const t = useTranslations();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  const hasActiveSubscription = isSubscriptionActive(user?.subscription);

  const [initial, setInitial] = useState<Partial<Village> | null>(null);
  const [applicationId, setApplicationId] = useState<string | undefined>();
  const [hasPrefill, setHasPrefill] = useState(false);
  const [existingVillage, setExistingVillage] = useState<Village | null>(null);
  // Covers both the localStorage read (kept off the server render so hydration
  // sees the same empty form) and the one-village-per-member lookup.
  const [isPreparing, setIsPreparing] = useState(true);

  useEffect(() => {
    if (!user?._id || !hasActiveSubscription) return;
    let isCurrent = true;
    setIsPreparing(true);
    fetchVillageCreatedBy(user._id).then((village) => {
      if (!isCurrent) return;
      setExistingVillage(village);
      if (!village) {
        const stored = readApplicationAnswers();
        if (stored) {
          setInitial({
            ...storedApplicationToVillageInitial(stored),
            // The launcher is an active subscriber, so their village starts at
            // the stage the deploy CTA unlocks from.
            onboardingStatus: 'subscribed',
          });
          setApplicationId(stored._id);
          setHasPrefill(true);
        } else {
          setInitial({ onboardingStatus: 'subscribed' });
        }
      }
      setIsPreparing(false);
    });
    return () => {
      isCurrent = false;
    };
  }, [user?._id, hasActiveSubscription]);

  if (isLoading) {
    return (
      <div className="bg-[#FCFDFB] min-h-screen flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Page401 />;
  }

  if (!hasActiveSubscription) {
    return (
      <>
        <Head>
          <title>{t('village_launch_title')}</title>
        </Head>
        <PageShell width="narrow">
          <GateCard
            title={t('village_launch_subscription_title')}
            body={t('village_launch_subscription_body')}
          >
            <Link href="/subscriptions" className={btnPrimary}>
              {t('village_launch_subscription_cta')}
            </Link>
            <Link href="/map" className={btnSecondary}>
              {t('ambassadors_cta_map')}
            </Link>
          </GateCard>
        </PageShell>
      </>
    );
  }

  if (existingVillage) {
    const villagePath = `/villages/${existingVillage.slug || existingVillage._id}`;
    return (
      <>
        <Head>
          <title>{t('village_launch_title')}</title>
        </Head>
        <PageShell width="narrow">
          <GateCard
            title={t('village_launch_existing_title')}
            body={t('village_launch_existing_body')}
          >
            <Link href={villagePath} className={btnPrimary}>
              {t('village_launch_existing_cta')}
            </Link>
          </GateCard>
        </PageShell>
      </>
    );
  }

  const handleSubmit = async (payload: CreateVillageInput) => {
    const created = await createVillage({
      ...payload,
      ...(applicationId ? { applicationId } : {}),
      managedBy: user?._id ? [user._id] : [],
    });
    // Their answers have become a village; a later application (or another
    // device) should not resurrect them into a stale pre-fill.
    clearApplicationAnswers();
    const path = created.slug || created._id;
    router.push(`/villages/${path}?created=1`);
  };

  return (
    <>
      <Head>
        <title>{t('village_launch_title')}</title>
      </Head>
      <PageShell width="narrow">
        <header className="text-center max-w-xl mx-auto mb-10">
          <Eyebrow>{t('village_launch_eyebrow')}</Eyebrow>
          <h1 className="font-serif text-4xl md:text-5xl leading-[1.08] mt-3">
            {t('village_launch_title')}
          </h1>
          <p className="text-[16px] text-[#5C6E64] mt-4 leading-relaxed">
            {t('village_launch_intro')}
          </p>
          {hasPrefill ? (
            <p className="inline-block text-[13.5px] font-semibold text-[#0B7A4C] bg-[#E2FAEE] border border-[#C2F0DA] rounded-full px-4 py-1.5 mt-5">
              {t('village_launch_prefill_note')}
            </p>
          ) : null}
        </header>
        {isPreparing ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : (
          <LaunchVillageForm initial={initial} onSubmit={handleSubmit} />
        )}
      </PageShell>
    </>
  );
};

export default LaunchVillagePage;
