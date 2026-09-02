import React from 'react';

import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useAuth } from '../contexts/auth';
import { usePlatform } from '../contexts/platform';
import AccountSettingsPage from '../pages/settings/account';
import { renderWithNextIntl } from './utils';

jest.mock('../contexts/auth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../contexts/platform', () => ({
  usePlatform: jest.fn(),
}));

jest.mock('../contexts/push-notifications', () => ({
  usePushNotifications: () => ({
    isSupported: false,
    permission: 'default',
    isSubscribed: false,
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
  }),
}));

jest.mock('../utils/cachedConfig.helpers', () => ({
  getCachedConfig: jest.fn(() => null),
}));

const savedUser = {
  _id: 'user-1',
  screenname: 'Sam',
  email: 'sam@example.com',
  phone: '',
  preferences: {},
  kycData: {
    IP: '1.2.3.4',
    legalName: 'Sam',
    TIN: '',
    address1: 'Rua A',
    postalCode: '1000',
    city: 'Lisbon',
    state: '',
    country: 'PT',
  },
  settings: {},
};

// The page imports "../../utils/api", which resolves to the real module here,
// so the mock has to name that file rather than the bare specifier that
// jest.config remaps.
jest.mock('../utils/api.js', () => ({
  __esModule: true,
  default: {
    get: jest.fn((url: string) => {
      if (url === '/meta/countries') {
        return Promise.resolve({
          data: { results: [{ name: 'Portugal', code: 'PT' }] },
        });
      }
      return Promise.resolve({ data: { results: {} } });
    }),
    post: jest.fn(() => Promise.resolve({ data: {} })),
  },
}));

const api = jest.requireMock('../utils/api.js').default as {
  get: jest.Mock;
  post: jest.Mock;
};

const patch = jest.fn(() => Promise.resolve({}));
const refetchUser = jest.fn(() => Promise.resolve());

beforeEach(() => {
  jest.clearAllMocks();
  window.scrollTo = jest.fn();
  api.get.mockImplementation((url: string) => {
    if (url === '/meta/countries') {
      return Promise.resolve({
        data: { results: [{ name: 'Portugal', code: 'PT' }] },
      });
    }
    return Promise.resolve({ data: { results: savedUser } });
  });
  (useAuth as unknown as jest.Mock).mockReturnValue({
    user: savedUser,
    isAuthenticated: true,
    refetchUser,
  });
  (usePlatform as unknown as jest.Mock).mockReturnValue({
    platform: { user: { patch } },
  });
});

const renderAccountTab = async () => {
  const typist = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
  // Each settings section has a route of its own, so the account fields are
  // rendered directly rather than reached by clicking a tab.
  renderWithNextIntl(<AccountSettingsPage />);
  await screen.findByLabelText(/tax/i);
  return typist;
};

describe('settings autosave', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('waits for the autosave interval instead of saving each keystroke', async () => {
    const typist = await renderAccountTab();

    const taxNumber = screen.getByLabelText(/tax/i) as HTMLInputElement;
    await typist.type(taxNumber, 'CHE-383.711.471');

    // Every character is on screen, and nothing has gone out yet.
    expect(taxNumber.value).toBe('CHE-383.711.471');
    expect(patch).not.toHaveBeenCalled();

    jest.advanceTimersByTime(5000);

    await waitFor(() => expect(patch).toHaveBeenCalledTimes(1));
    // The untouched fields ride along, because the API replaces kycData whole.
    expect(patch.mock.calls[0][1].kycData).toMatchObject({
      TIN: 'CHE-383.711.471',
      city: 'Lisbon',
      country: 'PT',
      legalName: 'Sam',
    });
    expect(taxNumber.value).toBe('CHE-383.711.471');
  });

  it('keeps characters typed while a save is in flight', async () => {
    let releasePatch = () => {};
    patch.mockImplementationOnce(
      () =>
        new Promise<Record<string, never>>((resolve) => {
          releasePatch = () => resolve({});
        }),
    );

    const typist = await renderAccountTab();

    const city = screen.getByLabelText(/city/i) as HTMLInputElement;
    await typist.type(city, 'X');
    jest.advanceTimersByTime(5000);
    await waitFor(() => expect(patch).toHaveBeenCalledTimes(1));

    // Still typing while the first request is open.
    await typist.type(city, 'Y');
    releasePatch();

    // Wait for the save cycle to finish writing the server's answer back.
    await waitFor(() =>
      expect(
        api.get.mock.calls.filter(([url]) => url === '/mine/user'),
      ).toHaveLength(1),
    );
    expect(city.value).toBe('LisbonXY');

    await act(async () => {
      jest.advanceTimersByTime(5000);
    });
    await waitFor(() => expect(patch).toHaveBeenCalledTimes(2));
    expect(patch.mock.calls[1][1].kycData).toMatchObject({ city: 'LisbonXY' });
  });

  it('saves a field as soon as it loses focus', async () => {
    const typist = await renderAccountTab();

    await typist.type(screen.getByLabelText(/city/i), 'X');
    await typist.click(screen.getByLabelText(/tax/i));

    await waitFor(() => expect(patch).toHaveBeenCalledTimes(1));
    expect(patch.mock.calls[0][1].kycData).toMatchObject({ city: 'LisbonX' });
  });
});

describe('settings verified fields', () => {
  it('posts the phone number that was typed', async () => {
    const typist = userEvent.setup();
    renderWithNextIntl(<AccountSettingsPage />);
    await screen.findByLabelText(/tax/i);

    await typist.click(screen.getByRole('button', { name: /edit phone/i }));
    await typist.type(screen.getByLabelText(/phone/i), '+351912345678');
    await typist.click(screen.getByRole('button', { name: /verify phone/i }));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/auth/phone/update', {
        phone: '+351912345678',
      }),
    );
  });

  it('keeps the phone being edited when the auth user refreshes', async () => {
    const typist = userEvent.setup();
    const { rerender } = renderWithNextIntl(<AccountSettingsPage />);
    await screen.findByLabelText(/tax/i);

    await typist.click(screen.getByRole('button', { name: /edit phone/i }));
    await typist.type(screen.getByLabelText(/phone/i), '+351912345678');

    // A save elsewhere on the page refetches the user, handing the page a new
    // object with the stored (empty) phone on it.
    (useAuth as unknown as jest.Mock).mockReturnValue({
      user: { ...savedUser },
      isAuthenticated: true,
      refetchUser,
    });
    rerender(<AccountSettingsPage />);

    expect((screen.getByLabelText(/phone/i) as HTMLInputElement).value).toBe(
      '+351912345678',
    );
    await typist.click(screen.getByRole('button', { name: /verify phone/i }));
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/auth/phone/update', {
        phone: '+351912345678',
      }),
    );
  });

  it('badges the contact fields the backend has confirmed', async () => {
    (useAuth as unknown as jest.Mock).mockReturnValue({
      user: { ...savedUser, email_verified: true, phone_verified: false },
      isAuthenticated: true,
      refetchUser,
    });

    const typist = userEvent.setup();
    renderWithNextIntl(<AccountSettingsPage />);
    await screen.findByLabelText(/tax/i);

    // One badge, on the email — the phone is not verified.
    expect(screen.getAllByText('Verified')).toHaveLength(1);
    expect(
      screen.getByLabelText(/email/i).closest('div')?.parentElement,
    ).toHaveTextContent('Verified');

    // It steps aside while the address is being changed, so it cannot be read
    // as vouching for what is currently in the box.
    await typist.click(screen.getByRole('button', { name: /edit email/i }));
    expect(screen.queryByText('Verified')).not.toBeInTheDocument();
  });

  it('posts the email address that was typed', async () => {
    const typist = userEvent.setup();
    renderWithNextIntl(<AccountSettingsPage />);
    await screen.findByLabelText(/tax/i);

    await typist.click(screen.getByRole('button', { name: /edit email/i }));
    const email = screen.getByLabelText(/email/i);
    await typist.clear(email);
    await typist.type(email, 'new@example.com');
    await typist.click(screen.getByRole('button', { name: /verify email/i }));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/auth/email/update', {
        email: 'new@example.com',
      }),
    );
  });
});
