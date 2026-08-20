import React from 'react';

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useAuth } from '../contexts/auth';
import { usePlatform } from '../contexts/platform';
import useRBAC from '../hooks/useRBAC';
import ThemingPage from '../pages/dashboard/theming';
import { THEME_COLOR_TOKENS, THEME_FONT_SLOTS } from '../theming';
import { renderWithNextIntl } from './utils';

jest.mock('../components/Dashboard/AdminLayout', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

jest.mock('../contexts/auth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../contexts/platform', () => ({
  usePlatform: jest.fn(),
}));

jest.mock('../hooks/useRBAC', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const makePlatform = (rows: any[] = []) => ({
  config: {
    get: jest.fn().mockResolvedValue({}),
    getOne: jest.fn().mockResolvedValue({}),
    find: jest.fn(() => ({ toJS: () => rows })),
    patch: jest.fn().mockResolvedValue({}),
    post: jest.fn().mockResolvedValue({}),
    // The real store resolves with a PUT_SUCCESS action rather than the
    // response body, and never rejects — see contexts/platform/platform.js.
    put: jest.fn().mockResolvedValue({ type: 'PUT_SUCCESS' }),
  },
});

const setup = (rows: any[] = []) => {
  const platform = makePlatform(rows);
  (useAuth as jest.Mock).mockReturnValue({
    user: { _id: 'user-1', roles: ['admin'] },
  });
  (usePlatform as jest.Mock).mockReturnValue({ platform });
  (useRBAC as jest.Mock).mockReturnValue({ hasAccess: () => true });
  return platform;
};

describe('ThemingPage', () => {
  it('hides itself from anyone without PlatformSettings access', () => {
    setup();
    (useRBAC as jest.Mock).mockReturnValue({ hasAccess: () => false });

    renderWithNextIntl(<ThemingPage />);

    expect(screen.queryByLabelText('Primary colour')).not.toBeInTheDocument();
  });

  it('renders the colour controls in the inspector by default', () => {
    setup();

    renderWithNextIntl(<ThemingPage />);

    expect(screen.getByLabelText('Primary colour')).toBeInTheDocument();
    expect(screen.getByLabelText('Secondary colour')).toBeInTheDocument();
    expect(screen.getByLabelText('Background colour')).toBeInTheDocument();
    expect(screen.getByLabelText('Text colour')).toBeInTheDocument();
  });

  it('swaps the inspector to the font controls when the Fonts tab is picked', async () => {
    setup();

    renderWithNextIntl(<ThemingPage />);

    expect(screen.queryByLabelText('Body font')).not.toBeInTheDocument();

    await userEvent.click(screen.getAllByText('Fonts')[0]);

    expect(screen.getByLabelText('Body font')).toBeInTheDocument();
    expect(screen.getByLabelText('Heading font')).toBeInTheDocument();
    expect(screen.queryByLabelText('Primary colour')).not.toBeInTheDocument();
  });

  it('tracks how many fields each section has set', async () => {
    setup([
      {
        slug: 'theming',
        value: { primaryColor: '#3ee08f', fontFamilyBody: 'inter' },
      },
    ]);

    renderWithNextIntl(<ThemingPage />);

    // Denominators come from the module so adding a field does not break this.
    await waitFor(() => {
      expect(screen.getByText('1/4')).toBeInTheDocument();
    });
    expect(
      screen.getByText(`1/${2 + THEME_FONT_SLOTS.length}`),
    ).toBeInTheDocument();
    expect(
      screen.getByText(`0/${THEME_COLOR_TOKENS.length}`),
    ).toBeInTheDocument();
  });

  it('seeds the form from the stored theming config', async () => {
    setup([
      {
        slug: 'theming',
        value: { primaryColor: '#3ee08f', fontFamilyBody: 'inter' },
      },
    ]);

    renderWithNextIntl(<ThemingPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Primary colour hex')).toHaveValue('#3ee08f');
    });
    await userEvent.click(screen.getAllByText('Fonts')[0]);
    expect(screen.getByLabelText('Body font')).toHaveValue('inter');
  });

  /**
   * The palette is complete at all times now that the schema ships defaults —
   * there is no "nothing configured" state for the preview to fall into.
   */
  it('shows the whole generated palette, and moves it as a colour is edited', async () => {
    setup();

    renderWithNextIntl(<ThemingPage />);

    expect(screen.getByText('accent-dark')).toBeInTheDocument();
    expect(screen.getByText('accent-foreground')).toBeInTheDocument();
    expect(screen.getByText('complimentary-light')).toBeInTheDocument();
    expect(screen.getByText('success')).toBeInTheDocument();

    const swatch = () =>
      screen.getByTitle('accent-dark').getAttribute('style');
    const before = swatch();

    const field = screen.getByLabelText('Primary colour hex');
    await userEvent.clear(field);
    await userEvent.type(field, '#1b3bc3');

    await waitFor(() => {
      expect(swatch()).not.toBe(before);
    });
  });

  it('PUTs the slug so one call works whether or not a document exists', async () => {
    const platform = setup([]);

    renderWithNextIntl(<ThemingPage />);

    const field = screen.getByLabelText('Primary colour hex');
    await userEvent.clear(field);
    await userEvent.type(field, '#3ee08f');
    await userEvent.click(screen.getByText('Save theme'));

    await waitFor(() => {
      expect(platform.config.put).toHaveBeenCalledWith('theming', {
        slug: 'theming',
        value: expect.objectContaining({
          primaryColor: '#3ee08f',
          enabled: true,
        }),
      });
    });
    // PUT upserts, so there is no create-vs-update branching left to get wrong.
    expect(platform.config.post).not.toHaveBeenCalled();
    expect(platform.config.patch).not.toHaveBeenCalled();
  });

  it('overwrites an existing document through the same single call', async () => {
    const platform = setup([
      { slug: 'theming', value: { primaryColor: '#3ee08f' } },
    ]);

    renderWithNextIntl(<ThemingPage />);

    await waitFor(() => {
      expect(screen.getByLabelText('Primary colour hex')).toHaveValue('#3ee08f');
    });
    await userEvent.click(screen.getAllByText('Fonts')[0]);
    await userEvent.selectOptions(screen.getByLabelText('Heading font'), 'lora');
    await userEvent.click(screen.getByText('Save theme'));

    await waitFor(() => {
      expect(platform.config.put).toHaveBeenCalledWith('theming', {
        slug: 'theming',
        value: expect.objectContaining({
          primaryColor: '#3ee08f',
          fontFamilyHeading: 'lora',
        }),
      });
    });
    expect(platform.config.post).not.toHaveBeenCalled();
  });

  it('reports a save status the admin can see', async () => {
    setup([]);

    renderWithNextIntl(<ThemingPage />);

    expect(screen.getByText('All changes saved')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Primary colour hex'), 'a');
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Save theme'));
    await waitFor(() => {
      expect(screen.getByText('All changes saved')).toBeInTheDocument();
    });
  });

  it('flags a colour that is not a hex value rather than saving nonsense silently', async () => {
    setup();

    renderWithNextIntl(<ThemingPage />);

    await userEvent.type(screen.getByLabelText('Primary colour hex'), 'blue');

    // Matched loosely: the example colour in this string is copy, not behaviour.
    expect(await screen.findByText(/Enter a hex colour/)).toBeInTheDocument();
  });

  /**
   * The platform store swallows request failures and resolves with an `error`
   * action, so a page relying on try/catch alone would flash "saved" on a
   * failed write. This is the realistic failure shape.
   */
  it('surfaces a save failure that the store resolved rather than threw', async () => {
    const platform = setup([]);
    platform.config.put.mockResolvedValue({
      type: 'PUT_ERROR',
      error: 'Nope',
    });

    renderWithNextIntl(<ThemingPage />);

    await userEvent.click(screen.getByText('Save theme'));

    expect(await screen.findByText('Nope')).toBeInTheDocument();
    expect(screen.getByText('Could not save')).toBeInTheDocument();
    expect(screen.queryByText('All changes saved')).not.toBeInTheDocument();
  });

  it('surfaces a save failure that threw outright', async () => {
    const platform = setup([]);
    platform.config.put.mockRejectedValue(new Error('Boom'));

    renderWithNextIntl(<ThemingPage />);

    await userEvent.click(screen.getByText('Save theme'));

    expect(await screen.findByText('Boom')).toBeInTheDocument();
    expect(screen.queryByText('All changes saved')).not.toBeInTheDocument();
  });
});
