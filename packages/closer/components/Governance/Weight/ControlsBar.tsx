import React from 'react';

import { useTranslations } from 'next-intl';

interface ControlsBarProps {
  isReading: boolean;
  onRead: () => void;
  onDownloadCsv: () => void;
  isCsvEnabled: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  showExcluded: boolean;
  onShowExcludedChange: (value: boolean) => void;
  hideZeroWeight: boolean;
  onHideZeroWeightChange: (value: boolean) => void;
}

const ControlsBar: React.FC<ControlsBarProps> = ({
  isReading,
  onRead,
  onDownloadCsv,
  isCsvEnabled,
  search,
  onSearchChange,
  showExcluded,
  onShowExcludedChange,
  hideZeroWeight,
  onHideZeroWeightChange,
}) => {
  const t = useTranslations();

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onRead}
        disabled={isReading}
        className="rounded-full border border-accent bg-accent px-4 py-1.5 text-[12.5px] font-semibold text-white transition-colors hover:enabled:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isReading
          ? t('governance_weight_reading_button')
          : t('governance_weight_read_button')}
      </button>
      <button
        type="button"
        onClick={onDownloadCsv}
        disabled={!isCsvEnabled}
        className="rounded-full border border-gray-900 px-4 py-1.5 text-[12.5px] font-semibold text-gray-900 transition-colors hover:enabled:bg-gray-900 hover:enabled:text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        {t('governance_weight_download_csv_button')}
      </button>
      <input
        type="text"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={t('governance_weight_search_placeholder')}
        aria-label={t('governance_weight_search_placeholder')}
        className="min-w-[160px] flex-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 font-mono text-[12.5px] text-gray-900"
      />
      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-[12.5px] text-gray-500">
        <input
          type="checkbox"
          checked={showExcluded}
          onChange={(event) => onShowExcludedChange(event.target.checked)}
          className="accent-accent"
        />
        {t('governance_weight_show_excluded_toggle')}
      </label>
      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-[12.5px] text-gray-500">
        <input
          type="checkbox"
          checked={hideZeroWeight}
          onChange={(event) => onHideZeroWeightChange(event.target.checked)}
          className="accent-accent"
        />
        {t('governance_weight_hide_zero_toggle')}
      </label>
    </div>
  );
};

export default ControlsBar;
