import { ChangeEvent } from 'react';

import { Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Spinner } from '../ui';

interface Props {
  value: string;
  onChange: (value: string) => void;
  isSearching?: boolean;
  placeholder?: string;
  className?: string;
  /** Extra classes merged onto the input itself (e.g. 'rounded-full'). */
  inputClassName?: string;
}

/**
 * Live search input for the booking lists. Debouncing is the caller's job
 * (see `useBookingSearchWhere`), so there is no submit button.
 */
const BookingsSearchBar = ({
  value,
  onChange,
  isSearching = false,
  placeholder,
  className = '',
  inputClassName = '',
}: Props) => {
  const t = useTranslations();

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <div className={`relative ${className}`}>
      <input
        value={value}
        onChange={handleChange}
        type="search"
        aria-label={t('bookings_search_label')}
        placeholder={placeholder ?? t('bookings_search_placeholder')}
        className={`w-full pl-3 pr-10 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent ${inputClassName}`}
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
        {isSearching ? (
          <Spinner />
        ) : value ? (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label={t('bookings_search_clear')}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <Search className="w-4 h-4 text-gray-400" />
        )}
      </div>
    </div>
  );
};

export default BookingsSearchBar;
