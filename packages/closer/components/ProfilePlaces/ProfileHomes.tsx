import React, { useEffect, useState } from 'react';

import { MapPin, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { User } from '../../contexts/auth/types';
import { PlacePrivacy, UserHome } from '../../types/userPlaces';
import { GeocodeResult } from '../../utils/geocode.helpers';
import { parseMessageFromError } from '../../utils/common';
import {
  createPlaceGeoJson,
  createPlaceId,
  filterVisibleHomes,
} from '../../utils/userPlaces.helpers';
import { Button } from '../ui';
import PlacePrivacySelect from './PlacePrivacySelect';
import PlaceSearchInput from './PlaceSearchInput';

type ProfileHomesProps = {
  homes: UserHome[];
  viewer: User | null;
  isOwnProfile: boolean;
  onSave: (homes: UserHome[]) => Promise<void>;
  alwaysEditing?: boolean;
  className?: string;
};

const ProfileHomes = ({
  homes,
  viewer,
  isOwnProfile,
  onSave,
  alwaysEditing = false,
  className = 'mb-6',
}: ProfileHomesProps) => {
  const t = useTranslations();
  const [draftHomes, setDraftHomes] = useState<UserHome[]>(homes);
  const [isEditing, setIsEditing] = useState(alwaysEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<GeocodeResult | null>(
    null,
  );
  const [newVisibility, setNewVisibility] = useState<PlacePrivacy>('all');

  useEffect(() => {
    setDraftHomes(homes);
  }, [homes]);

  useEffect(() => {
    if (alwaysEditing) setIsEditing(true);
  }, [alwaysEditing]);

  const visibleHomes = filterVisibleHomes(homes, viewer, isOwnProfile);
  const showSection = visibleHomes.length > 0 || isOwnProfile;

  if (!showSection) return null;

  const addHome = () => {
    if (!selectedPlace) {
      setError(t('profile_places_select_place_required'));
      return;
    }
    setError(null);
    setDraftHomes((prev) => [
      ...prev,
      {
        id: createPlaceId(),
        name: selectedPlace.name,
        geojson: createPlaceGeoJson(
          selectedPlace.name,
          selectedPlace.coordinates,
          selectedPlace.nameLong,
        ),
        visibility: newVisibility,
      },
    ]);
    setSelectedPlace(null);
    setNewVisibility('all');
  };

  const removeHome = (id: string) => {
    setDraftHomes((prev) => prev.filter((home) => home.id !== id));
  };

  const updateVisibility = (id: string, visibility: PlacePrivacy) => {
    setDraftHomes((prev) =>
      prev.map((home) => (home.id === id ? { ...home, visibility } : home)),
    );
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      await onSave(draftHomes);
      if (!alwaysEditing) setIsEditing(false);
    } catch (err) {
      setError(parseMessageFromError(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setDraftHomes(homes);
    setSelectedPlace(null);
    setError(null);
    if (!alwaysEditing) setIsEditing(false);
  };

  const listToShow = isEditing ? draftHomes : visibleHomes;

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}
    >
      <div className="flex justify-between items-center mb-4 gap-3">
        <div className="flex flex-col gap-1">
          <h4 className="font-medium text-xl">{t('profile_homes_title')}</h4>
          <p className="text-sm text-gray-500">{t('profile_homes_subtitle')}</p>
        </div>
        {isOwnProfile && !alwaysEditing && !isEditing && (
          <button
            type="button"
            onClick={() => {
              setDraftHomes(homes);
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
            {t('profile_homes_add_prompt')}
          </button>
        ) : (
          <p className="text-gray-500 italic">{t('profile_homes_empty')}</p>
        )
      ) : (
        <ul className="flex flex-col gap-3 mb-4">
          {listToShow.map((home) => (
            <li
              key={home.id}
              className="flex flex-col sm:flex-row sm:items-center gap-3 py-2 border-b border-gray-100 last:border-0"
            >
              <div className="flex items-start gap-2 min-w-0 flex-1">
                <MapPin className="w-4 h-4 mt-1 text-accent shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium truncate">{home.name}</p>
                  {home.geojson.properties.name_long &&
                    home.geojson.properties.name_long !== home.name && (
                      <p
                        className="text-xs text-gray-500 truncate"
                        title={home.geojson.properties.name_long}
                      >
                        {home.geojson.properties.name_long}
                      </p>
                    )}
                  {!isEditing && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {t(`profile_places_privacy_${home.visibility}`)}
                    </p>
                  )}
                </div>
              </div>
              {isEditing && (
                <div className="flex items-center gap-2 sm:w-56">
                  <PlacePrivacySelect
                    value={home.visibility}
                    onChange={(visibility) =>
                      updateVisibility(home.id, visibility)
                    }
                    className="flex-1"
                    showLabel={false}
                  />
                  <button
                    type="button"
                    onClick={() => removeHome(home.id)}
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
            label={t('profile_homes_place_label')}
            placeholder={t('profile_homes_place_placeholder')}
            selected={selectedPlace}
            onSelect={setSelectedPlace}
          />
          <PlacePrivacySelect
            value={newVisibility}
            onChange={setNewVisibility}
          />
          <Button
            onClick={addHome}
            variant="secondary"
            size="small"
            isFullWidth={false}
            className="self-start"
          >
            <span className="inline-flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              {t('profile_homes_add_button')}
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

export default ProfileHomes;
