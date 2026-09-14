import { FC, FormEvent, ReactNode, useMemo, useState } from 'react';

import { useTranslations } from 'next-intl';

import {
  MONTHLY_VOLUME_SOFT_MAX,
  MONTHLY_VOLUME_SOFT_MIN,
  PEOPLE_COUNT_MAX,
  PEOPLE_COUNT_MIN,
  ROOMS_COUNT_MIN,
  VILLAGE_REVIEWER_ROLES,
} from '../../constants/village.constants';
import {
  CreateVillageInput,
  LatLng,
  Village,
  VillageCriteria,
  VillageOnboardingStatus,
} from '../../types/village';
import { GeocodeResult } from '../../utils/geocode.helpers';
import {
  isVillageSlugFrozen,
  meetsHardCriteria,
  toLeafletCoords,
  villageAdminSettableStatuses,
} from '../../utils/village.utils';
import CommunityMap from '../CommunityMap';
import VillageBillingPanel from '../VillageBillingPanel';
import {
  Eyebrow,
  Pill,
  btnPrimary,
  inputClass,
  labelClass,
} from '../VillageUI';
import { ErrorMessage, TabNav, TabNavItem } from '../ui';
import PlaceSearch from './PlaceSearch';

type VillageFormProps = {
  initial?: Partial<Village>;
  submitLabel: string;
  onSubmit: (payload: CreateVillageInput) => Promise<void>;
  /** Unlocks the platform fields — onboarding stage and the deployed URLs. */
  isAdmin?: boolean;
  /**
   * Unlocks the internal sections — the fit checklist and the project manager
   * card. Team, admins and ambassadors only.
   */
  isReviewer?: boolean;
};

const emptyCriteria: VillageCriteria = {
  landBased: false,
  hasLand: false,
  peopleOnLand: false,
  operationalized: false,
  notTechnophobic: false,
  peopleCount: undefined,
  roomsCount: undefined,
  monthlyVolumeEur: undefined,
  ecologicalFocus: false,
  regenerativeCulture: false,
  web3Openness: false,
};

const HARD_CRITERIA = [
  'landBased',
  'hasLand',
  'peopleOnLand',
  'operationalized',
  'notTechnophobic',
] as const;

const SOFT_CRITERIA = [
  'ecologicalFocus',
  'regenerativeCulture',
  'web3Openness',
] as const;

const DESCRIPTION_MAX = 600;

/** The platform section is narrower than the reviewer ones: admins only. */
const PLATFORM_SECTION_ROLES = ['admin'];

/**
 * Names the roles that unlock a gated section, so whoever is editing can see
 * which hat the box is there for and who else will find it.
 */
const SectionAccess: FC<{ roles: string[] }> = ({ roles }) => {
  const t = useTranslations();
  return (
    <div
      className="flex flex-wrap items-center gap-1.5 mt-3"
      data-testid="section-access"
    >
      <span className="text-[12px] text-foreground/60">
        {t('villages_form_section_access_label')}
      </span>
      {roles.map((role) => (
        <Pill key={role} className="normal-case tracking-normal">
          {t(`villages_role_${role}`)}
        </Pill>
      ))}
    </div>
  );
};

const Section: FC<{
  title: string;
  description?: string;
  children: ReactNode;
}> = ({ title, description, children }) => (
  <section className="bg-background border border-accent-medium rounded-[22px] p-6 md:p-8">
    <h2 className="font-serif text-2xl text-foreground">{title}</h2>
    {description ? (
      <p className="text-[14.5px] text-foreground/70 mt-2 leading-relaxed">
        {description}
      </p>
    ) : null}
    <div className="mt-6 flex flex-col gap-5">{children}</div>
  </section>
);

/**
 * The form used to be one column of six stacked sections, which read fine on a
 * fresh village and badly on a live one — the fields an admin actually came for
 * were four screens down. The same sections are now grouped behind tabs; every
 * required field sits on the first one, so nothing can be missed by never
 * opening a tab.
 */
type TabKey = 'profile' | 'contact' | 'internal' | 'platform' | 'billing';

/** A tab plus the roles that unlock it; `roles` is dropped before TabNav sees it. */
type TabDef = TabNavItem<TabKey> & { roles?: string[] };

/**
 * A tab's contents. Gated tabs name their roles once at the top rather than on
 * every section inside them — within a tab the answer is always the same.
 * The ids pair with the ones TabNav puts on its buttons.
 */
const TabPanel: FC<{
  tabKey: TabKey;
  roles?: string[];
  children: ReactNode;
}> = ({ tabKey, roles, children }) => (
  <div
    role="tabpanel"
    id={`tabpanel-${tabKey}`}
    aria-labelledby={`tab-${tabKey}`}
    className="flex flex-col gap-8"
  >
    {roles?.length ? <SectionAccess roles={roles} /> : null}
    {children}
  </div>
);

/** Checkbox rendered as a full-width tappable card, so the list scans as a checklist. */
const CriteriaToggle: FC<{
  label: string;
  checked: boolean;
  onToggle: () => void;
}> = ({ label, checked, onToggle }) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={checked}
    onClick={onToggle}
    className={`flex items-center gap-3 text-left rounded-xl border px-4 py-3 text-[14.5px] transition-colors ${
      checked
        ? 'border-accent bg-accent-light/40 text-foreground'
        : 'border-neutral-dark bg-background text-foreground/70 hover:border-accent-medium'
    }`}
  >
    <span
      className={`flex-none w-5 h-5 rounded-md border-2 flex items-center justify-center text-[11px] font-bold ${
        checked
          ? 'bg-accent border-accent text-accent-foreground'
          : 'border-neutral-dark text-transparent'
      }`}
    >
      ✓
    </span>
    {label}
  </button>
);

const VillageForm = ({
  initial,
  submitLabel,
  onSubmit,
  isAdmin = false,
  isReviewer = false,
}: VillageFormProps) => {
  const t = useTranslations();
  const [name, setName] = useState(initial?.name || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [country, setCountry] = useState(initial?.country || '');
  const [website, setWebsite] = useState(initial?.website || '');
  const [tags, setTags] = useState((initial?.tags || []).join(', '));
  // `initial` is an API village, so its coords are GeoJSON — convert once here
  // and keep every other piece of form state in Leaflet order.
  const initialLatLng = toLeafletCoords(initial?.coords);
  const [lat, setLat] = useState(initialLatLng ? String(initialLatLng[0]) : '');
  const [lng, setLng] = useState(initialLatLng ? String(initialLatLng[1]) : '');
  const [contactEmail, setContactEmail] = useState(
    initial?.contact?.email || '',
  );
  const [contactPhone, setContactPhone] = useState(
    initial?.contact?.phone || '',
  );
  const [instagram, setInstagram] = useState(
    initial?.contact?.social?.instagram || '',
  );
  const [twitter, setTwitter] = useState(
    initial?.contact?.social?.twitter || '',
  );
  const [facebook, setFacebook] = useState(
    initial?.contact?.social?.facebook || '',
  );
  const [pmName, setPmName] = useState(initial?.projectManager?.name || '');
  const [pmEmail, setPmEmail] = useState(initial?.projectManager?.email || '');
  const [pmRole, setPmRole] = useState(initial?.projectManager?.role || '');
  const [appUrl, setAppUrl] = useState(initial?.appUrl || '');
  const [apiUrl, setApiUrl] = useState(initial?.apiUrl || '');
  const [slug, setSlug] = useState(initial?.slug || '');
  const [onboardingStatus, setOnboardingStatus] =
    useState<VillageOnboardingStatus>(initial?.onboardingStatus || 'map_only');
  // Procurement owns the deploy pipeline, and on a managed village the deploy
  // outcome too, so those stages are not on the menu. An unmanaged village
  // keeps the full set — hand-setting one to `live` is how a village that
  // already runs Closer gets recorded.
  const settableStatuses = villageAdminSettableStatuses(initial);
  // Anything off that menu is procurement's to write, not ours to edit.
  const isStatusLocked = !settableStatuses.includes(onboardingStatus);
  // The slug is procurement's join key from `deploy_requested` onwards, so it
  // is read-only from then on rather than merely validated on submit. The
  // *pending* status counts: picking a frozen stage must freeze the slug in the
  // same edit, or this PATCH could rename the join key on its way in.
  const isSlugFrozen =
    isVillageSlugFrozen(initial) ||
    isVillageSlugFrozen({
      onboardingStatus,
      managed: initial?.managed === true,
    });
  const [criteria, setCriteria] = useState<VillageCriteria>({
    ...emptyCriteria,
    ...(initial?.criteria || {}),
  });
  const [error, setError] = useState<string | null>(null);
  const [invalidFields, setInvalidFields] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const pickedCoords = useMemo<LatLng | null>(() => {
    const latitude = Number(lat);
    const longitude = Number(lng);
    if (!lat || !lng || Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return null;
    }
    return [latitude, longitude];
  }, [lat, lng]);

  // Set at mount and again only when an address is picked: editing an existing
  // village opens on its pin, but clicking to move the pin must not yank the
  // viewport out from under the cursor.
  const [view, setView] = useState(() =>
    initialLatLng
      ? { center: initialLatLng, zoom: 8 }
      : { center: [40, 0] as LatLng, zoom: 3 },
  );

  const hardCriteriaMet = HARD_CRITERIA.filter((key) =>
    Boolean(criteria[key]),
  ).length;
  const isFit = meetsHardCriteria(criteria);

  // Billing is admin-only *and* needs a saved village: its credentials hang off
  // an id, so there is nothing to issue while the village is still being typed.
  const villageId = initial?._id;
  const tabs: TabDef[] = [
    { id: 'profile', label: t('villages_form_tab_profile') },
    { id: 'contact', label: t('villages_form_tab_contact') },
    ...(isReviewer
      ? [
          {
            id: 'internal' as const,
            label: t('villages_form_tab_internal'),
            roles: VILLAGE_REVIEWER_ROLES,
          },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            id: 'platform' as const,
            label: t('villages_form_tab_platform'),
            roles: PLATFORM_SECTION_ROLES,
          },
        ]
      : []),
    ...(isAdmin && villageId
      ? [
          {
            id: 'billing' as const,
            label: t('villages_form_tab_billing'),
            roles: PLATFORM_SECTION_ROLES,
          },
        ]
      : []),
  ];
  const [activeTab, setActiveTab] = useState<TabKey>('profile');

  const toggleCriteria = (key: keyof VillageCriteria) => {
    setCriteria((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const setNumericCriteria = (key: keyof VillageCriteria, value: string) => {
    setCriteria((prev) => ({
      ...prev,
      [key]: value ? Number(value) : undefined,
    }));
  };

  const handlePick = (coords: LatLng) => {
    setLat(coords[0].toFixed(5));
    setLng(coords[1].toFixed(5));
    setInvalidFields((prev) => prev.filter((field) => field !== 'coords'));
  };

  const handlePlaceSelect = (place: GeocodeResult) => {
    // Geocode results are GeoJSON `[lng, lat]`; the map and fields want Leaflet's.
    const [placeLng, placeLat] = place.coordinates;
    handlePick([placeLat, placeLng]);
    setView({ center: [placeLat, placeLng], zoom: 12 });
    // A typed country stays; the lookup only fills in what is still blank.
    if (place.country && !country.trim()) {
      setCountry(place.country);
      setInvalidFields((prev) => prev.filter((field) => field !== 'country'));
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    const missing: string[] = [];
    if (!name.trim()) missing.push('name');
    if (!description.trim()) missing.push('description');
    if (!country.trim()) missing.push('country');
    if (!pickedCoords) missing.push('coords');

    if (missing.length > 0) {
      setInvalidFields(missing);
      setError(t('villages_form_error_required'));
      // Every required field lives on the first tab, so the highlighted fields
      // are never left sitting behind a tab the editor cannot see.
      setActiveTab('profile');
      return;
    }

    setInvalidFields([]);

    // The fit checklist only ever decides between the two pre-deploy stages, so
    // it must not walk a village that is already subscribed or live back to the
    // start — and once an admin sets the stage by hand, their choice wins.
    // Editors who never saw the checklist leave the stage exactly as it was.
    const derived = isFit ? 'pre_assessed' : 'map_only';
    const current = initial?.onboardingStatus;
    const nextOnboardingStatus: VillageOnboardingStatus = isAdmin
      ? onboardingStatus
      : !isReviewer
      ? current || 'map_only'
      : !current || current === 'map_only' || current === 'pre_assessed'
      ? derived
      : current;

    const payload: CreateVillageInput = {
      name: name.trim(),
      description: description.trim(),
      country: country.trim(),
      website: website.trim() || undefined,
      tags: tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      coords: pickedCoords as LatLng,
      status: initial?.status || 'planning',
      contact: {
        email: contactEmail.trim() || undefined,
        phone: contactPhone.trim() || undefined,
        social: {
          instagram: instagram.trim() || undefined,
          twitter: twitter.trim() || undefined,
          facebook: facebook.trim() || undefined,
        },
      },
      // The checklist and the manager card are internal: an owner never sees
      // them, so their untouched form state must not be written back.
      ...(isReviewer
        ? {
            criteria,
            projectManager: {
              name: pmName.trim() || undefined,
              email: pmEmail.trim() || undefined,
              role: pmRole.trim() || undefined,
            },
          }
        : {}),
      onboardingStatus: nextOnboardingStatus,
      // Omitted entirely for non-admins — they never see these fields, and
      // sending empty form state would blank whatever an admin had set. Sent as
      // a plain trimmed string for admins so emptying a field actually clears it.
      ...(isAdmin ? { appUrl: appUrl.trim(), apiUrl: apiUrl.trim() } : {}),
      // A frozen slug is not sent at all: the API would reject the write, and
      // the field the admin sees is read-only anyway.
      ...(isAdmin && !isSlugFrozen && slug.trim() ? { slug: slug.trim() } : {}),
    };

    try {
      setIsLoading(true);
      await onSubmit(payload);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t('villages_form_error_save');
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const fieldClass = (field: string) =>
    `${inputClass} ${
      invalidFields.includes(field) ? '!border-failure bg-failure/5' : ''
    }`;

  return (
    <div className="flex flex-col gap-8">
      <TabNav
        items={tabs}
        active={activeTab}
        label={t('villages_form_tabs_label')}
        onSelect={setActiveTab}
        className="border-b border-neutral-dark pb-3"
      />

      {/* Billing talks to its own routes and saves itself, so it sits outside
          the form rather than under a Save button that would not apply to it. */}
      {activeTab === 'billing' && villageId ? (
        <TabPanel tabKey="billing" roles={PLATFORM_SECTION_ROLES}>
          <Section
            title={t('villages_form_billing_title')}
            description={t('villages_form_billing_intro')}
          >
            <VillageBillingPanel
              villageId={villageId}
              villageName={initial?.name}
              villageSlug={initial?.slug}
            />
          </Section>
        </TabPanel>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          {activeTab === 'profile' ? (
            <TabPanel tabKey="profile">
              <Section
                title={t('villages_form_basics_title')}
                description={t('villages_form_basics_intro')}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <label className="flex flex-col gap-2">
                    <span className={labelClass}>
                      {t('villages_form_name')} *
                    </span>
                    <input
                      className={fieldClass('name')}
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder={t('villages_form_name_placeholder')}
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className={labelClass}>
                      {t('villages_form_country')} *
                    </span>
                    <input
                      className={fieldClass('country')}
                      value={country}
                      onChange={(event) => setCountry(event.target.value)}
                      placeholder={t('villages_form_country_placeholder')}
                    />
                  </label>
                </div>

                <label className="flex flex-col gap-2">
                  <span className={labelClass}>
                    {t('villages_form_description')} *
                  </span>
                  <textarea
                    className={`${fieldClass(
                      'description',
                    )} min-h-[140px] resize-y leading-relaxed`}
                    value={description}
                    maxLength={DESCRIPTION_MAX}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder={t('villages_form_description_placeholder')}
                  />
                  <span className="text-[12px] text-foreground/50 self-end">
                    {description.length}/{DESCRIPTION_MAX}
                  </span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <label className="flex flex-col gap-2">
                    <span className={labelClass}>
                      {t('villages_form_website')}
                    </span>
                    <input
                      className={inputClass}
                      value={website}
                      onChange={(event) => setWebsite(event.target.value)}
                      placeholder="https://"
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className={labelClass}>
                      {t('villages_form_tags')}
                    </span>
                    <input
                      className={inputClass}
                      value={tags}
                      onChange={(event) => setTags(event.target.value)}
                      placeholder={t('villages_form_tags_placeholder')}
                    />
                    <span className="text-[12px] text-foreground/50">
                      {t('villages_form_tags_hint')}
                    </span>
                  </label>
                </div>
              </Section>

              <Section
                title={t('villages_form_location_title')}
                description={t('villages_form_location_intro')}
              >
                <PlaceSearch onSelect={handlePlaceSelect} />
                <div
                  className={`relative rounded-[18px] overflow-hidden border ${
                    invalidFields.includes('coords')
                      ? 'border-failure'
                      : 'border-accent-medium'
                  }`}
                >
                  <div className="h-[340px]">
                    <CommunityMap
                      isPicker
                      pickedCoords={pickedCoords}
                      onPick={handlePick}
                      center={view.center}
                      zoom={view.zoom}
                      scrollWheelZoom
                    />
                  </div>
                  {!pickedCoords ? (
                    <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center z-[2]">
                      <span className="rounded-full bg-background/95 border border-accent-medium px-4 py-2 text-[13px] font-semibold text-accent-text shadow-sm">
                        {t('villages_form_location_hint')}
                      </span>
                    </div>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <label className="flex flex-col gap-2">
                    <span className={labelClass}>
                      {t('villages_form_latitude')} *
                    </span>
                    <input
                      className={fieldClass('coords')}
                      value={lat}
                      inputMode="decimal"
                      onChange={(event) => setLat(event.target.value)}
                      placeholder="38.0123"
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className={labelClass}>
                      {t('villages_form_longitude')} *
                    </span>
                    <input
                      className={fieldClass('coords')}
                      value={lng}
                      inputMode="decimal"
                      onChange={(event) => setLng(event.target.value)}
                      placeholder="-8.4567"
                    />
                  </label>
                </div>
              </Section>
            </TabPanel>
          ) : null}

          {activeTab === 'contact' ? (
            <TabPanel tabKey="contact">
              <Section
                title={t('villages_form_public_contact_title')}
                description={t('villages_form_public_contact_intro')}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <label className="flex flex-col gap-2">
                    <span className={labelClass}>
                      {t('villages_form_contact_email')}
                    </span>
                    <input
                      className={inputClass}
                      type="email"
                      value={contactEmail}
                      onChange={(event) => setContactEmail(event.target.value)}
                      placeholder="hello@village.org"
                    />
                    <span className="text-[12px] text-foreground/50">
                      {t('villages_form_contact_email_hint')}
                    </span>
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className={labelClass}>
                      {t('villages_form_contact_phone')}
                    </span>
                    <input
                      className={inputClass}
                      type="tel"
                      value={contactPhone}
                      onChange={(event) => setContactPhone(event.target.value)}
                      placeholder="+351 900 000 000"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <label className="flex flex-col gap-2">
                    <span className={labelClass}>
                      {t('villages_form_contact_instagram')}
                    </span>
                    <input
                      className={inputClass}
                      value={instagram}
                      onChange={(event) => setInstagram(event.target.value)}
                      placeholder="@village"
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className={labelClass}>
                      {t('villages_form_contact_twitter')}
                    </span>
                    <input
                      className={inputClass}
                      value={twitter}
                      onChange={(event) => setTwitter(event.target.value)}
                      placeholder="@village"
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className={labelClass}>
                      {t('villages_form_contact_facebook')}
                    </span>
                    <input
                      className={inputClass}
                      value={facebook}
                      onChange={(event) => setFacebook(event.target.value)}
                      placeholder="facebook.com/village"
                    />
                  </label>
                </div>
              </Section>
            </TabPanel>
          ) : null}

          {activeTab === 'internal' && isReviewer ? (
            <TabPanel tabKey="internal" roles={VILLAGE_REVIEWER_ROLES}>
              <Section
                title={t('villages_form_contact_title')}
                description={t('villages_form_contact_intro')}
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <label className="flex flex-col gap-2">
                    <span className={labelClass}>
                      {t('villages_form_pm_name')}
                    </span>
                    <input
                      className={inputClass}
                      value={pmName}
                      onChange={(event) => setPmName(event.target.value)}
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className={labelClass}>
                      {t('villages_form_pm_email')}
                    </span>
                    <input
                      className={inputClass}
                      type="email"
                      value={pmEmail}
                      onChange={(event) => setPmEmail(event.target.value)}
                      placeholder="name@village.org"
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className={labelClass}>
                      {t('villages_form_pm_role')}
                    </span>
                    <input
                      className={inputClass}
                      value={pmRole}
                      onChange={(event) => setPmRole(event.target.value)}
                      placeholder={t('villages_form_pm_role_placeholder')}
                    />
                  </label>
                </div>
              </Section>

              <Section
                title={t('villages_form_fit_title')}
                description={t('villages_form_fit_intro')}
              >
                {/* Live read-out of where the village stands against the hard criteria. */}
                <div
                  className={`rounded-[18px] border px-5 py-4 flex flex-wrap items-center gap-x-5 gap-y-2 ${
                    isFit
                      ? 'border-accent-medium bg-accent-light'
                      : 'border-neutral-dark bg-neutral-light'
                  }`}
                >
                  <div className="flex-1 min-w-[200px]">
                    <p
                      className={`text-[15px] font-semibold ${
                        isFit ? 'text-accent-text' : 'text-foreground'
                      }`}
                    >
                      {isFit
                        ? t('villages_form_fit_pass')
                        : t('villages_form_fit_progress', {
                            met: hardCriteriaMet,
                            total: HARD_CRITERIA.length,
                          })}
                    </p>
                    <p className="text-[13px] text-foreground/70 mt-1">
                      {isFit
                        ? t('villages_form_fit_pass_hint')
                        : t('villages_form_fit_progress_hint')}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    {HARD_CRITERIA.map((key) => (
                      <span
                        key={key}
                        className={`w-8 h-1.5 rounded-full ${
                          criteria[key] ? 'bg-accent' : 'bg-neutral-dark'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <Eyebrow className="mb-3">
                    {t('villages_form_hard_criteria')}
                  </Eyebrow>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {HARD_CRITERIA.map((key) => (
                      <CriteriaToggle
                        key={key}
                        label={t(`villages_criteria_${key}`)}
                        checked={Boolean(criteria[key])}
                        onToggle={() => toggleCriteria(key)}
                      />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <label className="flex flex-col gap-2">
                    <span className={labelClass}>
                      {t('villages_form_people_count')}
                    </span>
                    <input
                      className={inputClass}
                      type="number"
                      value={
                        criteria.peopleCount !== undefined
                          ? String(criteria.peopleCount)
                          : ''
                      }
                      onChange={(event) =>
                        setNumericCriteria('peopleCount', event.target.value)
                      }
                      placeholder={`${PEOPLE_COUNT_MIN}–${PEOPLE_COUNT_MAX}`}
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className={labelClass}>
                      {t('villages_form_rooms_count')}
                    </span>
                    <input
                      className={inputClass}
                      type="number"
                      value={
                        criteria.roomsCount !== undefined
                          ? String(criteria.roomsCount)
                          : ''
                      }
                      onChange={(event) =>
                        setNumericCriteria('roomsCount', event.target.value)
                      }
                      placeholder={`${ROOMS_COUNT_MIN}+`}
                    />
                  </label>
                </div>

                <div className="pt-2 border-t border-neutral-dark">
                  <Eyebrow className="mb-3 mt-4">
                    {t('villages_form_soft_signals')}
                  </Eyebrow>
                  <label className="flex flex-col gap-2 mb-4 max-w-sm">
                    <span className={labelClass}>
                      {t('villages_form_monthly_volume')}
                    </span>
                    <input
                      className={inputClass}
                      type="number"
                      value={
                        criteria.monthlyVolumeEur !== undefined
                          ? String(criteria.monthlyVolumeEur)
                          : ''
                      }
                      onChange={(event) =>
                        setNumericCriteria(
                          'monthlyVolumeEur',
                          event.target.value,
                        )
                      }
                      placeholder={`${MONTHLY_VOLUME_SOFT_MIN}–${MONTHLY_VOLUME_SOFT_MAX}`}
                    />
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {SOFT_CRITERIA.map((key) => (
                      <CriteriaToggle
                        key={key}
                        label={t(`villages_criteria_${key}`)}
                        checked={Boolean(criteria[key])}
                        onToggle={() => toggleCriteria(key)}
                      />
                    ))}
                  </div>
                </div>
              </Section>
            </TabPanel>
          ) : null}

          {activeTab === 'platform' && isAdmin ? (
            <TabPanel tabKey="platform" roles={PLATFORM_SECTION_ROLES}>
              <Section
                title={t('villages_form_platform_title')}
                description={t('villages_form_platform_intro')}
              >
                <label className="flex flex-col gap-2 max-w-sm">
                  <span className={labelClass}>
                    {t('villages_form_onboarding_status')}
                  </span>
                  <select
                    className={inputClass}
                    value={onboardingStatus}
                    disabled={isStatusLocked}
                    onChange={(event) =>
                      setOnboardingStatus(
                        event.target.value as VillageOnboardingStatus,
                      )
                    }
                  >
                    {/* The in-flight value stays selectable so the form can round-trip
                  a village mid-deploy; it just cannot be picked for any other. */}
                    {isStatusLocked ? (
                      <option value={onboardingStatus}>
                        {t(`village_status_${onboardingStatus}`)}
                      </option>
                    ) : null}
                    {settableStatuses.map((status) => (
                      <option key={status} value={status}>
                        {t(`village_status_${status}`)}
                      </option>
                    ))}
                  </select>
                  <span className="text-[12px] text-foreground/50">
                    {isStatusLocked
                      ? t('villages_form_onboarding_status_locked')
                      : t('villages_form_onboarding_status_hint')}
                  </span>
                </label>

                <label className="flex flex-col gap-2 max-w-sm">
                  <span className={labelClass}>{t('villages_form_slug')}</span>
                  <input
                    className={inputClass}
                    value={slug}
                    readOnly={isSlugFrozen}
                    disabled={isSlugFrozen}
                    onChange={(event) => setSlug(event.target.value)}
                    placeholder="riverbank"
                  />
                  <span className="text-[12px] text-foreground/50">
                    {isSlugFrozen
                      ? t('villages_form_slug_frozen')
                      : t('villages_form_slug_hint')}
                  </span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <label className="flex flex-col gap-2">
                    <span className={labelClass}>
                      {t('villages_form_app_url')}
                    </span>
                    <input
                      className={inputClass}
                      value={appUrl}
                      onChange={(event) => setAppUrl(event.target.value)}
                      placeholder="https://village.closer.earth"
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className={labelClass}>
                      {t('villages_form_api_url')}
                    </span>
                    <input
                      className={inputClass}
                      value={apiUrl}
                      onChange={(event) => setApiUrl(event.target.value)}
                      placeholder="https://api.closer.earth"
                    />
                  </label>
                </div>
              </Section>
            </TabPanel>
          ) : null}

          {error ? <ErrorMessage error={error} /> : null}

          {/* One Save for the whole form: the tabs only decide what is on
              screen, never what gets sent. */}
          <div className="sticky bottom-0 -mx-6 px-6 py-4 bg-neutral-light/95 backdrop-blur border-t border-neutral-dark flex flex-wrap items-center gap-4">
            <button type="submit" disabled={isLoading} className={btnPrimary}>
              {isLoading ? t('villages_form_saving') : submitLabel}
            </button>
            <p className="text-[13px] text-foreground/70">
              {t('villages_form_submit_hint')}
            </p>
          </div>
        </form>
      )}
    </div>
  );
};

export default VillageForm;
