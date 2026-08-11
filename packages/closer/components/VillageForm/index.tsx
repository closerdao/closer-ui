import { FormEvent, useState } from 'react';

import { Button, ErrorMessage, Heading, Input } from '../ui';

import {
  CreateVillageInput,
  Village,
  VillageCriteria,
} from '../../types/village';
import { meetsHardCriteria } from '../../utils/village.utils';
import {
  MONTHLY_VOLUME_SOFT_MAX,
  MONTHLY_VOLUME_SOFT_MIN,
  PEOPLE_COUNT_MAX,
  PEOPLE_COUNT_MIN,
  ROOMS_COUNT_MIN,
} from '../../constants/village.constants';

type VillageFormProps = {
  initial?: Partial<Village>;
  submitLabel: string;
  onSubmit: (payload: CreateVillageInput) => Promise<void>;
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

const VillageForm = ({
  initial,
  submitLabel,
  onSubmit,
}: VillageFormProps) => {
  const [name, setName] = useState(initial?.name || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [country, setCountry] = useState(initial?.country || '');
  const [website, setWebsite] = useState(initial?.website || '');
  const [tags, setTags] = useState((initial?.tags || []).join(', '));
  const [lat, setLat] = useState(
    initial?.coords?.[0] !== undefined ? String(initial.coords[0]) : '',
  );
  const [lng, setLng] = useState(
    initial?.coords?.[1] !== undefined ? String(initial.coords[1]) : '',
  );
  const [pmName, setPmName] = useState(initial?.projectManager?.name || '');
  const [pmEmail, setPmEmail] = useState(initial?.projectManager?.email || '');
  const [pmRole, setPmRole] = useState(initial?.projectManager?.role || '');
  const [criteria, setCriteria] = useState<VillageCriteria>({
    ...emptyCriteria,
    ...(initial?.criteria || {}),
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const toggleCriteria = (key: keyof VillageCriteria) => {
    setCriteria((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    const latitude = Number(lat);
    const longitude = Number(lng);
    if (
      !name.trim() ||
      !description.trim() ||
      !country.trim() ||
      Number.isNaN(latitude) ||
      Number.isNaN(longitude)
    ) {
      setError('Please fill in name, description, country, and coordinates.');
      return;
    }

    const payload: CreateVillageInput = {
      name: name.trim(),
      description: description.trim(),
      country: country.trim(),
      website: website.trim() || undefined,
      tags: tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      coords: [latitude, longitude],
      status: initial?.status || 'planning',
      criteria,
      projectManager: {
        name: pmName.trim() || undefined,
        email: pmEmail.trim() || undefined,
        role: pmRole.trim() || undefined,
      },
      onboardingStatus: meetsHardCriteria(criteria)
        ? 'pre_assessed'
        : 'map_only',
    };

    try {
      setIsLoading(true);
      await onSubmit(payload);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to save land project.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-2xl">
      <div className="flex flex-col gap-3">
        <Heading level={3} className="text-lg">
          Project details
        </Heading>
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          isRequired
        />
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Description</span>
          <textarea
            className="w-full min-h-[120px] rounded-md border border-gray-300 p-3 text-sm"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </label>
        <Input
          label="Country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          isRequired
        />
        <Input
          label="Website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
        <Input
          label="Tags (comma separated)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Latitude"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            isRequired
          />
          <Input
            label="Longitude"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            isRequired
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Heading level={3} className="text-lg">
          Project manager
        </Heading>
        <Input
          label="Name"
          value={pmName}
          onChange={(e) => setPmName(e.target.value)}
        />
        <Input
          label="Email"
          value={pmEmail}
          onChange={(e) => setPmEmail(e.target.value)}
        />
        <Input
          label="Role"
          value={pmRole}
          onChange={(e) => setPmRole(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-3">
        <Heading level={3} className="text-lg">
          Fit criteria
        </Heading>
        <p className="text-sm text-gray-600">
          Hard requirements help decide if a village is a match for Closer.
        </p>
        {(
          [
            ['landBased', 'Land-based project'],
            ['hasLand', 'Has real land'],
            ['peopleOnLand', 'People involved and on the land'],
            ['operationalized', 'Somewhat operationalized'],
            ['notTechnophobic', 'Not techno-phobic / open to digital tools'],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(criteria[key])}
              onChange={() => toggleCriteria(key)}
            />
            {label}
          </label>
        ))}
        <Input
          label={`People involved (${PEOPLE_COUNT_MIN}–${PEOPLE_COUNT_MAX})`}
          type="number"
          value={
            criteria.peopleCount !== undefined
              ? String(criteria.peopleCount)
              : ''
          }
          onChange={(e) =>
            setCriteria((prev) => ({
              ...prev,
              peopleCount: e.target.value ? Number(e.target.value) : undefined,
            }))
          }
        />
        <Input
          label={`Rooms available or planned (min ${ROOMS_COUNT_MIN})`}
          type="number"
          value={
            criteria.roomsCount !== undefined
              ? String(criteria.roomsCount)
              : ''
          }
          onChange={(e) =>
            setCriteria((prev) => ({
              ...prev,
              roomsCount: e.target.value ? Number(e.target.value) : undefined,
            }))
          }
        />
        <p className="text-sm text-gray-600 pt-2">Soft signals</p>
        <Input
          label={`Monthly transaction volume EUR (ideal ${MONTHLY_VOLUME_SOFT_MIN}–${MONTHLY_VOLUME_SOFT_MAX})`}
          type="number"
          value={
            criteria.monthlyVolumeEur !== undefined
              ? String(criteria.monthlyVolumeEur)
              : ''
          }
          onChange={(e) =>
            setCriteria((prev) => ({
              ...prev,
              monthlyVolumeEur: e.target.value
                ? Number(e.target.value)
                : undefined,
            }))
          }
        />
        {(
          [
            ['ecologicalFocus', 'Ecological regeneration focus'],
            ['regenerativeCulture', 'Regenerative culture'],
            ['web3Openness', 'Open to decentralization / web3'],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(criteria[key])}
              onChange={() => toggleCriteria(key)}
            />
            {label}
          </label>
        ))}
      </div>

      {error ? <ErrorMessage error={error} /> : null}

      <Button type="submit" isEnabled={!isLoading} isLoading={isLoading}>
        {submitLabel}
      </Button>
    </form>
  );
};

export default VillageForm;
