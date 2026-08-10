import React from 'react';

import Heading from '../ui/Heading';

interface Props {
  title: string;
  /** Optional one-line explanation under the title. */
  subtitle?: string;
  /** Controls that belong beside the title — a time-frame selector, a filter. */
  children?: React.ReactNode;
}

/**
 * The common header for every /dashboard/* page. Pages were each rolling their
 * own — some with `md:items-center`, some `md:items-end`, cohousing with an
 * uppercase h1 inside a second `<main>` — which made the section titles change
 * size and alignment as you moved through the nav.
 */
const DashboardPageHeader = ({ title, subtitle, children }: Props) => (
  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
    <div className="flex flex-col gap-1">
      <Heading level={2}>{title}</Heading>
      {subtitle && (
        <p className="text-sm text-gray-600 max-w-2xl">{subtitle}</p>
      )}
    </div>
    {children && (
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
        {children}
      </div>
    )}
  </div>
);

export default DashboardPageHeader;
