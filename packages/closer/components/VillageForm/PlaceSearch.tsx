import { KeyboardEvent, useId, useState } from 'react';

import { useTranslations } from 'next-intl';

import { usePlaceSearch } from '../../hooks/usePlaceSearch';
import { GeocodeResult } from '../../utils/geocode.helpers';
import { btnSmall, inputClass, labelClass } from '../VillageUI';

type PlaceSearchProps = {
  onSelect: (place: GeocodeResult) => void;
};

/**
 * Address lookup for the village form — the same Nominatim search the profile
 * uses for homes, restyled for the funnel and without a `<form>` of its own,
 * since it sits inside the village form and nested forms are not a thing.
 */
const PlaceSearch = ({ onSelect }: PlaceSearchProps) => {
  const t = useTranslations();
  const inputId = useId();
  const [query, setQuery] = useState('');
  const { results, isLoading, hasFailed, search, clear } = usePlaceSearch();

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    // Enter looks the address up; it must not submit the village around it.
    event.preventDefault();
    void search(query);
  };

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className={labelClass}>
        {t('villages_form_address_search')}
      </label>
      <div className="relative flex gap-2">
        <input
          id={inputId}
          className={inputClass}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            clear();
          }}
          onKeyDown={handleKeyDown}
          placeholder={t('villages_form_address_search_placeholder')}
          autoComplete="off"
        />
        <button
          type="button"
          className={`${btnSmall} shrink-0`}
          onClick={() => void search(query)}
          disabled={isLoading}
        >
          {isLoading ? t('generic_loading') : t('generic_search')}
        </button>
        {results.length > 0 && (
          <ul
            role="listbox"
            className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-xl border border-accent-medium bg-background shadow-lg"
          >
            {results.map((result) => (
              <li
                key={`${result.nameLong}-${result.coordinates.join(',')}`}
                role="presentation"
              >
                <button
                  type="button"
                  role="option"
                  aria-selected={false}
                  className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-accent-light"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onSelect(result);
                    setQuery(result.nameLong);
                    clear();
                  }}
                >
                  {result.nameLong}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {hasFailed ? (
        <p className="text-[13px] text-failure">
          {t('profile_places_search_error')}
        </p>
      ) : (
        <p className="text-[13px] text-foreground/70">
          {t('villages_form_address_search_hint')}
        </p>
      )}
    </div>
  );
};

export default PlaceSearch;
