import React, { useEffect, useState } from 'react';

import dayjs from 'dayjs';
import { CalendarDays, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { User } from '../../contexts/auth/types';
import { PlacePrivacy, UpcomingVisit } from '../../types/userPlaces';
import { parseMessageFromError } from '../../utils/common';
import { GeocodeResult } from '../../utils/geocode.helpers';
import {
  createPlaceGeoJson,
  createPlaceId,
  filterVisibleUpcomingVisits,
  sortUpcomingVisits,
} from '../../utils/userPlaces.helpers';
import { Button, Input } from '../ui';
import PlacePrivacySelect from './PlacePrivacySelect';
import PlaceSearchInput from './PlaceSearchInput';

type ProfileUpcomingVisitsProps = {
  visits: UpcomingVisit[];
  viewer: User | null;
  isOwnProfile: boolean;
  onSave: (visits: UpcomingVisit[]) => Promise<void>;
  alwaysEditing?: boolean;
  className?: string;
};

const formatVisitDates = (visit: UpcomingVisit): string => {
  const start = dayjs(visit.startDate).format('MMM D, YYYY');
  if (!visit.endDate || visit.endDate === visit.startDate) return start;
  return `${start} – ${dayjs(visit.endDate).format('MMM D, YYYY')}`;
};

const ProfileUpcomingVisits = ({
  visits,
  viewer,
  isOwnProfile,
  onSave,
  alwaysEditing = false,
  className = 'mb-6',
}: ProfileUpcomingVisitsProps) => {
  const t = useTranslations();
  const [draftVisits, setDraftVisits] = useState<UpcomingVisit[]>(visits);
  const [isEditing, setIsEditing] = useState(alwaysEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<GeocodeResult | null>(
    null,
  );
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [newVisibility, setNewVisibility] = useState<PlacePrivacy>('all');

  const visitsSignature = JSON.stringify(visits);
  useEffect(() => {
    setDraftVisits(JSON.parse(visitsSignature) as UpcomingVisit[]);
  }, [visitsSignature]);

  useEffect(() => {
    if (alwaysEditing) setIsEditing(true);
  }, [alwaysEditing]);

  const visibleVisits = sortUpcomingVisits(
    filterVisibleUpcomingVisits(visits, viewer, isOwnProfile),
  );
  const showSection = visibleVisits.length > 0 || isOwnProfile;

  if (!showSection) return null;

  const resetForm = () => {
    setSelectedPlace(null);
    setStartDate('');
    setEndDate('');
    setNewVisibility('all');
  };

  const addVisit = () => {
    if (!selectedPlace) {
      setError(t('profile_places_select_place_required'));
      return;
    }
    if (!startDate) {
      setError(t('profile_visits_start_required'));
      return;
    }
    if (endDate && endDate < startDate) {
      setError(t('profile_visits_end_before_start'));
      return;
    }

    setError(null);
    setDraftVisits((prev) =>
      sortUpcomingVisits([
        ...prev,
        {
          id: createPlaceId(),
          name: selectedPlace.name,
          geojson: createPlaceGeoJson(
            selectedPlace.name,
            selectedPlace.coordinates,
            selectedPlace.nameLong,
          ),
          startDate,
          ...(endDate ? { endDate } : {}),
          visibility: newVisibility,
        },
      ]),
    );
    resetForm();
  };

  const removeVisit = (id: string) => {
    setDraftVisits((prev) => prev.filter((visit) => visit.id !== id));
  };

  const updateVisibility = (id: string, visibility: PlacePrivacy) => {
    setDraftVisits((prev) =>
      prev.map((visit) =>
        visit.id === id ? { ...visit, visibility } : visit,
      ),
    );
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      await onSave(sortUpcomingVisits(draftVisits));
      if (!alwaysEditing) setIsEditing(false);
    } catch (err) {
      setError(parseMessageFromError(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setDraftVisits(visits);
    resetForm();
    setError(null);
    if (!alwaysEditing) setIsEditing(false);
  };

  const listToShow = isEditing
    ? sortUpcomingVisits(draftVisits)
    : visibleVisits;

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}
    >
      <div className="flex justify-between items-center mb-4 gap-3">
        <div className="flex flex-col gap-1">
          <h4 className="font-medium text-xl">{t('profile_visits_title')}</h4>
          <p className="text-sm text-gray-500">{t('profile_visits_subtitle')}</p>
        </div>
        {isOwnProfile && !alwaysEditing && !isEditing && (
          <button
            type="button"
            onClick={() => {
              setDraftVisits(visits);
              setIsEditing(true);
            }}
            className="text-sm text-accent hover:underline shrink-0"
          >
            {t('members_slug_edit')}
          </button>
        )}
      </div>

      {listToShow.length === 0 && !isEditing ? (
        isOwnProfile ? (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="w-full text-left border-2 border-dashed border-accent/50 rounded-md p-4 text-accent hover:bg-accent-light transition-colors"
          >
            {t('profile_visits_add_prompt')}
          </button>
        ) : (
          <p className="text-gray-500 italic">{t('profile_visits_empty')}</p>
        )
      ) : (
        <ul className="flex flex-col gap-3 mb-4">
          {listToShow.map((visit) => (
            <li
              key={visit.id}
              className="flex flex-col sm:flex-row sm:items-center gap-3 py-2 border-b border-gray-100 last:border-0"
            >
              <div className="flex items-start gap-2 min-w-0 flex-1">
                <CalendarDays className="w-4 h-4 mt-1 text-accent shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium truncate">{visit.name}</p>
                  <p className="text-sm text-gray-600">
                    {formatVisitDates(visit)}
                  </p>
                  {visit.geojson?.properties.name_long &&
                    visit.geojson.properties.name_long !== visit.name && (
                      <p
                        className="text-xs text-gray-500 truncate"
                        title={visit.geojson.properties.name_long}
                      >
                        {visit.geojson.properties.name_long}
                      </p>
                    )}
                  {!isEditing && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {t(`profile_places_privacy_${visit.visibility}`)}
                    </p>
                  )}
                </div>
              </div>
              {isEditing && (
                <div className="flex items-center gap-2 sm:w-56">
                  <PlacePrivacySelect
                    value={visit.visibility}
                    onChange={(visibility) =>
                      updateVisibility(visit.id, visibility)
                    }
                    className="flex-1"
                    showLabel={false}
                  />
                  <button
                    type="button"
                    onClick={() => removeVisit(visit.id)}
                    className="p-2 text-gray-400 hover:text-red-500"
                    aria-label={t('generic_remove')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {isEditing && (
        <div className="flex flex-col gap-3 border-t border-gray-100 pt-4">
          <PlaceSearchInput
            label={t('profile_visits_place_label')}
            placeholder={t('profile_visits_place_placeholder')}
            selected={selectedPlace}
            onSelect={setSelectedPlace}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label={t('profile_visits_start_label')}
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
            <Input
              label={t('profile_visits_end_label')}
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </div>
          <PlacePrivacySelect
            value={newVisibility}
            onChange={setNewVisibility}
          />
          <Button
            onClick={addVisit}
            variant="secondary"
            size="small"
            isFullWidth={false}
            className="self-start"
          >
            <span className="inline-flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              {t('profile_visits_add_button')}
            </span>
          </Button>
          {error && (
            <p className="validation-error">
              {t('members_slug_error_prefix')} {error}
            </p>
          )}
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              isEnabled={!isSaving}
              size="small"
              isFullWidth={false}
            >
              {t('generic_save_button')}
            </Button>
            {!alwaysEditing && (
              <Button
                onClick={handleCancel}
                variant="secondary"
                size="small"
                isFullWidth={false}
              >
                {t('generic_cancel')}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileUpcomingVisits;
