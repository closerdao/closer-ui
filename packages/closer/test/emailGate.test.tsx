import React from 'react';

import { act, screen, waitFor } from '@testing-library/react';

import CustomSectionComponent from '../components/custom-pages/CustomSectionComponent';
import { unlockEmailGate } from '../hooks/useEmailGate';
import { renderWithNextIntl } from './utils';

jest.mock('../components/Newsletter', () => ({
  __esModule: true,
  default: () => <div data-testid="newsletter-form" />,
}));

const gateSection = {
  settings: {},
  content: { title: 'Unlock it', description: 'Give us your email' },
};

const gatedTable = {
  settings: { gatedByEmail: true },
  content: {
    title: 'Secret numbers',
    columns: [{ label: 'Item' }, { label: 'Amount', align: 'right' }],
    rows: [{ cells: [{ text: 'Land' }, { text: '€1' }] }],
  },
};

describe('email gate blocks', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows the gate and hides gated blocks until an email is given', async () => {
    renderWithNextIntl(
      <>
        <CustomSectionComponent type="emailGate" data={gateSection} />
        <CustomSectionComponent type="dataTable" data={gatedTable} />
      </>,
    );

    await waitFor(() => {
      expect(screen.getByText('Unlock it')).toBeInTheDocument();
    });
    expect(screen.queryByText('Secret numbers')).not.toBeInTheDocument();
  });

  it('reveals gated blocks once unlocked', async () => {
    renderWithNextIntl(
      <>
        <CustomSectionComponent type="emailGate" data={gateSection} />
        <CustomSectionComponent type="dataTable" data={gatedTable} />
      </>,
    );

    await waitFor(() => {
      expect(screen.getByText('Unlock it')).toBeInTheDocument();
    });

    act(() => {
      unlockEmailGate();
    });

    await waitFor(() => {
      expect(screen.getByText('Secret numbers')).toBeInTheDocument();
    });
    expect(screen.queryByText('Unlock it')).not.toBeInTheDocument();
  });

  it('keeps gated blocks visible in the page editor', async () => {
    renderWithNextIntl(
      <CustomSectionComponent type="dataTable" data={gatedTable} embedded />,
    );
    expect(screen.getByText('Secret numbers')).toBeInTheDocument();
  });

  it('renders ungated blocks normally', () => {
    renderWithNextIntl(
      <CustomSectionComponent
        type="documents"
        data={{
          settings: {},
          content: {
            title: 'Reports',
            items: [
              { title: 'Annual report', href: '/x.pdf', downloadLabel: 'Download' },
            ],
          },
        }}
      />,
    );
    expect(screen.getByText('Annual report')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/x.pdf');
  });
});
