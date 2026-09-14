import { screen } from '@testing-library/react';

import { renderWithNextIntl } from '../test/utils';
import AccountingEntityFootnote from './AccountingEntityFootnote';
import { getCachedConfig } from '../utils/cachedConfig.helpers';

jest.mock('../utils/cachedConfig.helpers', () => ({
  getCachedConfig: jest.fn(),
}));

const mockedGetCachedConfig = getCachedConfig as jest.Mock;

describe('AccountingEntityFootnote', () => {
  beforeEach(() => {
    mockedGetCachedConfig.mockReset();
  });

  it('names the entity assigned to the product', () => {
    mockedGetCachedConfig.mockReturnValue({
      enabled: true,
      elements: [
        { legalName: 'Dream Factory LDA', products: ['accommodations'] },
        { legalName: 'OASA Association', products: ['donations'] },
      ],
    });

    renderWithNextIntl(
      <AccountingEntityFootnote productSlug="accommodations" />,
    );

    expect(
      screen.getByText(/this payment goes to Dream Factory LDA/i),
    ).toBeInTheDocument();
  });

  it('renders nothing when accounting entities are disabled', () => {
    mockedGetCachedConfig.mockReturnValue({
      enabled: false,
      elements: [
        { legalName: 'Dream Factory LDA', products: ['accommodations'] },
      ],
    });

    const { container } = renderWithNextIntl(
      <AccountingEntityFootnote productSlug="accommodations" />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when no entity covers the product', () => {
    mockedGetCachedConfig.mockReturnValue({
      enabled: true,
      elements: [{ legalName: 'OASA Association', products: ['donations'] }],
    });

    const { container } = renderWithNextIntl(
      <AccountingEntityFootnote productSlug="accommodations" />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
