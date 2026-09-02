import { useRouter } from 'next/router';

import React from 'react';

import ApplicationModal from '../components/ApplicationModal';
import { PromptGetInTouchContext } from '../components/PromptGetInTouchContext';

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useAuth } from '../contexts/auth';
import { ConfigProvider } from '../contexts/config';
import api from '../utils/api.js';
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
    {
      name: 'website',
      label: 'Link to your website or deck',
      type: 'url',
      placeholder: 'https://',
      required: false,
    },
  ],
};

const mockedPost = (api as unknown as { post: jest.Mock }).post;

// renderWithNextIntl already wraps in a ConfigProvider, but with the env
// config only; the inner provider wins, carrying the applications fields.
const renderModal = (applications = applicationsConfig) =>
  renderWithNextIntl(
    <ConfigProvider config={{ applications }}>
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
    delete process.env.NEXT_PUBLIC_FEATURE_FEDERATION;
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

    await user.click(screen.getByRole('button', { name: 'Create my account' }));
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

  it('stops at the subscription on a platform without villages', async () => {
    mockedUseAuth.mockReturnValue({ isAuthenticated: false });

    renderModal();
    await submitApplication();

    expect(screen.getByText('Subscribe')).toBeInTheDocument();
    expect(screen.queryByText('Create your village')).not.toBeInTheDocument();
    expect(screen.queryByText('Deploy your village')).not.toBeInTheDocument();
  });

  it('tells the whole five step story where villages exist', async () => {
    process.env.NEXT_PUBLIC_FEATURE_FEDERATION = 'true';
    mockedUseAuth.mockReturnValue({ isAuthenticated: false });

    renderModal();
    await submitApplication();

    expect(screen.getByText('Application received')).toBeInTheDocument();
    expect(screen.getByText('Create your account')).toBeInTheDocument();
    expect(screen.getByText('Subscribe')).toBeInTheDocument();
    expect(screen.getByText('Create your village')).toBeInTheDocument();
    expect(screen.getByText('Deploy your village')).toBeInTheDocument();

    // The prompt still asks for the one step that is actually next.
    expect(
      screen.getByRole('button', { name: 'Create my account' }),
    ).toBeInTheDocument();
  });

  it('stores a scheme-less website or deck link as an absolute URL', async () => {
    mockedUseAuth.mockReturnValue({ isAuthenticated: false });

    renderModal();
    const user = userEvent.setup();
    await user.type(
      screen.getByPlaceholderText('https://'),
      'riverbank.pt/deck',
    );
    await submitApplication();

    expect(mockedPost).toHaveBeenCalledWith(
      '/application',
      expect.objectContaining({
        fields: { website: 'https://riverbank.pt/deck' },
      }),
    );
    // /village/launch pre-fills `website` from what was stored here.
    expect(
      JSON.parse(localStorage.getItem('closer:application-answers') || '{}')
        .fields,
    ).toEqual({ website: 'https://riverbank.pt/deck' });
  });

  it('asks for the website where villages exist, even if the saved config never did', async () => {
    process.env.NEXT_PUBLIC_FEATURE_FEDERATION = 'true';
    mockedUseAuth.mockReturnValue({ isAuthenticated: false });

    // The stored config predates the question: only name and email.
    renderModal({
      ...applicationsConfig,
      fields: applicationsConfig.fields.slice(0, 2),
    });

    expect(
      screen.getByLabelText('Link to your website or deck'),
    ).toBeInTheDocument();
    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText('https://'), 'riverbank.pt');
    await submitApplication();
    expect(mockedPost).toHaveBeenCalledWith(
      '/application',
      expect.objectContaining({
        fields: { website: 'https://riverbank.pt/' },
      }),
    );
  });

  it('does not add the website question on a platform without villages', () => {
    mockedUseAuth.mockReturnValue({ isAuthenticated: false });

    renderModal({
      ...applicationsConfig,
      fields: applicationsConfig.fields.slice(0, 2),
    });

    expect(screen.queryByPlaceholderText('https://')).not.toBeInTheDocument();
  });

  it('rejects a link that cannot become a URL, and lets it be left empty', async () => {
    mockedUseAuth.mockReturnValue({ isAuthenticated: false });

    renderModal();
    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText('Your name'), 'Ada');
    await user.type(
      screen.getByPlaceholderText('Your email'),
      'ada@example.com',
    );
    await user.type(screen.getByPlaceholderText('https://'), 'not a link');
    await user.click(screen.getByRole('button', { name: 'Send application' }));

    expect(
      await screen.findByText('Please enter a valid link'),
    ).toBeInTheDocument();
    expect(mockedPost).not.toHaveBeenCalled();

    await user.clear(screen.getByPlaceholderText('https://'));
    await user.click(screen.getByRole('button', { name: 'Send application' }));
    await waitFor(() => {
      expect(screen.getByText('Next steps')).toBeInTheDocument();
    });
    expect(mockedPost).toHaveBeenCalledWith(
      '/application',
      expect.objectContaining({ fields: {} }),
    );
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
