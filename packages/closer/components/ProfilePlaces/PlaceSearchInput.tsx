import React, { useEffect, useRef, useState } from 'react';

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
      className="relative flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        runSearch(query);
      }}
    >
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
      />
      <Button
        type="submit"
        variant="secondary"
        size="small"
        isFullWidth={false}
        className="self-start"
      >
        {t('generic_search')}
      </Button>
      {isLoading && (
        <p className="text-xs text-gray-500">{t('generic_loading')}</p>
      )}
      {error && <p className="validation-error text-sm">{error}</p>}
      {isOpen && results.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-md">
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
      {selected && (
        <p className="text-xs text-gray-500 truncate" title={selected.nameLong}>
          {selected.nameLong}
        </p>
      )}
    </form>
  );
};

export default PlaceSearchInput;
