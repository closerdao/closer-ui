import React, { useEffect, useRef, useState } from 'react';

import { Check, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { GeocodeResult, searchPlaces } from '../../utils/geocode.helpers';
import { Button, Input } from '../ui';

type PlaceSearchInputProps = {
  label: string;
  placeholder?: string;
  selected: GeocodeResult | null;
  onSelect: (place: GeocodeResult | null) => void;
};

const PlaceSearchInput = ({
  label,
  placeholder,
  selected,
  onSelect,
}: PlaceSearchInputProps) => {
  const t = useTranslations();
  const [query, setQuery] = useState(
    selected?.nameLong || selected?.name || '',
  );
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const selectedLabelRef = useRef(selected?.nameLong || selected?.name || '');

  useEffect(() => {
    const selectedLabel = selected?.nameLong || selected?.name || '';
    const previousLabel = selectedLabelRef.current;
    selectedLabelRef.current = selectedLabel;

    if (selected) {
      setQuery(selectedLabel);
      return;
    }

    setQuery((current) => (current === previousLabel ? '' : current));
  }, [selected?.name, selected?.nameLong]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const runSearch = async (value: string) => {
    abortRef.current?.abort();

    if (value.trim().length < 2) {
      setResults([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setIsLoading(true);
    setError(null);
    try {
      const places = await searchPlaces(value, controller.signal);
      if (!controller.signal.aborted) {
        setResults(places);
        setIsOpen(true);
      }
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return;
      setResults([]);
      setError(t('profile_places_search_error'));
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  };

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        runSearch(query);
      }}
    >
      {/* Nominatim's usage policy rules out per-keystroke lookups, so the
          search stays an explicit action — sat next to the field rather than
          under it, so the pair still reads as one control. */}
      <div className="relative flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <Input
            label={label}
            placeholder={placeholder}
            value={query}
            onChange={(event) => {
              const value = event.target.value;
              setQuery(value);
              if (selected) onSelect(null);
              setResults([]);
              setIsOpen(false);
            }}
            autoComplete="off"
            className="w-full"
          />
        </div>
        <Button
          type="submit"
          variant="secondary"
          size="small"
          isFullWidth={false}
          isEnabled={!isLoading}
          title={t('generic_search')}
          className="min-h-[50px] shrink-0 !px-3 sm:!px-4"
        >
          {/* The label collapses to its icon on narrow screens so the field it
              belongs to keeps enough room to read what you typed. */}
          <span className="inline-flex items-center gap-1.5">
            <Search className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">
              {isLoading ? t('generic_loading') : t('generic_search')}
            </span>
          </span>
        </Button>
        {isOpen && results.length > 0 && (
          <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
            {results.map((result) => (
              <li key={`${result.nameLong}-${result.coordinates.join(',')}`}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-accent-light"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onSelect(result);
                    setQuery(result.nameLong);
                    setIsOpen(false);
                    setResults([]);
                  }}
                >
                  {result.nameLong}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {error && <p className="validation-error text-sm">{error}</p>}
      {selected && (
        <p
          className="flex items-center gap-1.5 text-xs text-accent"
          title={selected.nameLong}
        >
          <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
          <span className="truncate">{selected.nameLong}</span>
        </p>
      )}
    </form>
  );
};

export default PlaceSearchInput;
