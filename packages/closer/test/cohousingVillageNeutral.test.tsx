import React from 'react';

import {
  QuizPanel,
  UnitPanel,
} from '../components/cohousing/cohousingStepPanels';
import CustomPressHighlights from '../components/custom-pages/CustomPressHighlights';
import CustomTeamDepartments from '../components/custom-pages/CustomTeamDepartments';
import CustomTeamMembers from '../components/custom-pages/CustomTeamMembers';

import { cleanup, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';

import { ConfigProvider } from '../contexts/config';
import messagesBase from '../locales/base-en.json';
import messagesTdf from '../locales/tdf/en.json';
import type { CohousingApplication } from '../types/cohousingApplication';
import {
  COHOUSING_TIER_RESERVATION_EUR,
  getCohousingFinancialSummary,
} from '../utils/cohousingFinancials.helpers';

const renderAs = (appName: 'tdf' | 'my-village', ui: React.ReactElement) =>
  render(
    <ConfigProvider config={{ APP_NAME: appName }}>
      <NextIntlClientProvider
        locale="en"
        messages={
          appName === 'tdf' ? { ...messagesBase, ...messagesTdf } : messagesBase
        }
        timeZone="Europe/Lisbon"
        onError={() => {}}
      >
        {ui}
      </NextIntlClientProvider>
    </ConfigProvider>,
  );

describe('co-housing flow on a village vs TDF', () => {
  it('shows the TDF quiz on TDF and a plain step submit on a village', () => {
    const props = { draftStorageKey: 'k', onSubmit: jest.fn() };
    renderAs('tdf', <QuizPanel {...props} />);
    expect(screen.getByText(/TDF co-housing neighborhoods/)).toBeTruthy();
    cleanup();

    const village = renderAs('my-village', <QuizPanel {...props} />);
    expect(village.queryByText(/TDF/)).toBeNull();
    expect(village.getByRole('button', { name: 'Submit step' })).toBeTruthy();
  });

  it('lists TDF units on TDF only', () => {
    renderAs('tdf', <UnitPanel onSubmit={jest.fn()} />);
    expect(screen.getByText('EP-01')).toBeTruthy();
    cleanup();

    const village = renderAs('my-village', <UnitPanel onSubmit={jest.fn()} />);
    expect(village.queryByText('EP-01')).toBeNull();
  });

  it('derives reservation amounts from a tier only when amounts are given', () => {
    const app = { tier: 'standard' } as CohousingApplication;
    expect(
      getCohousingFinancialSummary(app, COHOUSING_TIER_RESERVATION_EUR)
        ?.reservationAmount,
    ).toBe(50000);
    expect(
      getCohousingFinancialSummary(app)?.reservationAmount,
    ).toBeUndefined();
  });
});

describe('page block fallbacks on a village vs TDF', () => {
  it('falls back to TDF copy on TDF and to nothing on a village', () => {
    renderAs('tdf', <CustomTeamMembers />);
    expect(screen.getByText('Samuel Delesque')).toBeTruthy();
    cleanup();

    const village = renderAs('my-village', <CustomTeamMembers />);
    expect(village.queryByText('Samuel Delesque')).toBeNull();
    expect(village.container.textContent).not.toMatch(/team_/);
  });

  it('keeps block content on a village', () => {
    const content = {
      eyebrow: 'In the news',
      items: [{ outlet: 'Local Paper', title: 'Village opens', url: '#' }],
    };
    renderAs('my-village', <CustomPressHighlights content={content} />);
    expect(screen.getByText('In the news')).toBeTruthy();
    expect(screen.getByText('Village opens')).toBeTruthy();
  });

  it('keeps a team block header on a village with no departments', () => {
    renderAs(
      'my-village',
      <CustomTeamDepartments content={{ title: 'Our teams' }} />,
    );
    expect(screen.getByText('Our teams')).toBeTruthy();
  });
});
