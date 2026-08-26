import React from 'react';

import { useRouter } from 'next/router';

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ApplicationModal from '../components/ApplicationModal';
import { PromptGetInTouchContext } from '../components/PromptGetInTouchContext';
import { ConfigProvider } from '../contexts/config';
import { useAuth } from '../contexts/auth';
import { renderWithNextIntl } from './utils';

jest.mock('../contexts/auth', () => ({
  useAuth: jest.fn(),
}));

// jest.config maps the bare "../utils/api" specifier to test/__mocks__/api.js,
// which is a different module than the "../../utils/api" the modal imports.
// Mock the real file path so the POST resolves instead of hitting the network.
jest.mock('../utils/api.js', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ data: { results: [] } })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
  },
}));

const mockedUseAuth = useAuth as unknown as jest.Mock;

const setIsOpen = jest.fn();

const applicationsConfig = {
  enabled: true,
  fields: [
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      placeholder: 'Your name',
      required: true,
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      placeholder: 'Your email',
      required: true,
    },
  ],
};

// renderWithNextIntl already wraps in a ConfigProvider, but with the env
// config only; the inner provider wins, carrying the applications fields.
const renderModal = () =>
  renderWithNextIntl(
    <ConfigProvider config={{ applications: applicationsConfig }}>
      <PromptGetInTouchContext.Provider value={{ isOpen: true, setIsOpen }}>
        <ApplicationModal />
      </PromptGetInTouchContext.Provider>
    </ConfigProvider>,
  );

const pushMock = () =>
  (useRouter as unknown as jest.Mock).mock.results[0].value.push as jest.Mock;

const submitApplication = async () => {
  const user = userEvent.setup();
  await user.type(screen.getByPlaceholderText('Your name'), 'Ada');
  await user.type(screen.getByPlaceholderText('Your email'), 'ada@example.com');
  await user.click(screen.getByRole('button', { name: 'Send application' }));
  await waitFor(() => {
    expect(screen.getByText('Next steps')).toBeInTheDocument();
  });
  return user;
};

describe('ApplicationModal next steps', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('guides a logged out applicant to create an account', async () => {
    mockedUseAuth.mockReturnValue({ isAuthenticated: false });

    renderModal();
    const user = await submitApplication();

    expect(screen.getByText('Application received')).toBeInTheDocument();
    expect(screen.getByText('Create your account')).toBeInTheDocument();
    expect(screen.getByText('Subscribe')).toBeInTheDocument();

    // The signup form pre-fills from this key.
    expect(localStorage.getItem('email')).toBe('ada@example.com');

    await user.click(
      screen.getByRole('button', { name: 'Create my account' }),
    );
    expect(setIsOpen).toHaveBeenCalledWith(false);
    expect(pushMock()).toHaveBeenCalledWith('/signup?back=%2Fsubscriptions');
  });

  it('sends a signed in applicant straight to plans', async () => {
    mockedUseAuth.mockReturnValue({ isAuthenticated: true });

    renderModal();
    const user = await submitApplication();

    expect(screen.getByText("You're signed in")).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Create my account' }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Choose a plan' }));
    expect(setIsOpen).toHaveBeenCalledWith(false);
    expect(pushMock()).toHaveBeenCalledWith('/subscriptions');
  });

  it('lets the applicant defer the next steps', async () => {
    mockedUseAuth.mockReturnValue({ isAuthenticated: false });

    renderModal();
    const user = await submitApplication();

    await user.click(
      screen.getByRole('button', { name: "I'll do this later" }),
    );
    expect(setIsOpen).toHaveBeenCalledWith(false);
    expect(pushMock()).not.toHaveBeenCalled();
  });
});
