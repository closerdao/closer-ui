import { useRouter } from 'next/router';

import React from 'react';

import CloserEmailCollector from '../components/CloserEmailCollector';
import { PromptGetInTouchContext } from '../components/PromptGetInTouchContext';

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { api } from 'closer';

import { useAuth } from '../contexts/auth';
import { renderWithNextIntl } from './utils';

jest.mock('../contexts/auth', () => ({
  useAuth: jest.fn(),
}));

// The collector pulls Button/Heading/Input/api through the "closer" barrel,
// whose internal "./utils/api" import escapes the mapped api mock. Rebuild the
// barrel surface it uses from the real components, with the api stubbed.
jest.mock('closer', () => ({
  __esModule: true,
  Button: jest.requireActual('../components/ui/Button').default,
  Heading: jest.requireActual('../components/ui/Heading').default,
  Input: jest.requireActual('../components/ui/Input').default,
  api: {
    get: jest.fn(() => Promise.resolve({ data: { results: [] } })),
    post: jest.fn(() =>
      Promise.resolve({ data: { results: { _id: 'app-1' } } }),
    ),
  },
}));

const mockedUseAuth = useAuth as unknown as jest.Mock;

const setIsOpen = jest.fn();

const renderModal = () =>
  renderWithNextIntl(
    <PromptGetInTouchContext.Provider value={{ isOpen: true, setIsOpen }}>
      <CloserEmailCollector />
    </PromptGetInTouchContext.Provider>,
  );

const pushMock = () =>
  (useRouter as unknown as jest.Mock).mock.results[0].value.push as jest.Mock;

const submitApplication = async () => {
  const user = userEvent.setup();
  await user.type(screen.getByPlaceholderText('Full Name'), 'Ada');
  await user.type(
    screen.getByPlaceholderText('Email Address'),
    'ada@example.com',
  );
  await user.type(
    screen.getByPlaceholderText('Project/Community Name'),
    'Solarpunk Village',
  );
  await user.click(
    screen.getByRole('button', { name: 'Launch your community' }),
  );
  await waitFor(() => {
    expect(screen.getByText('You’re on the list')).toBeInTheDocument();
  });
  return user;
};

describe('CloserEmailCollector next steps', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    delete process.env.NEXT_PUBLIC_FEATURE_FEDERATION;
  });

  it('offers a logged out applicant the launch-now path via signup', async () => {
    process.env.NEXT_PUBLIC_FEATURE_FEDERATION = 'true';
    mockedUseAuth.mockReturnValue({ isAuthenticated: false });

    renderModal();
    const user = await submitApplication();

    // Flow 1 stays visible: the GTM reply promise with the applicant's email.
    expect(screen.getByText('ada@example.com')).toBeInTheDocument();

    // Flow 2: the launch-now steps — the same five the application modal and
    // the funnel pages draw.
    expect(screen.getByText('Application received')).toBeInTheDocument();
    expect(screen.getByText('Create your account')).toBeInTheDocument();
    expect(screen.getByText('Subscribe')).toBeInTheDocument();
    expect(screen.getByText('Create your village')).toBeInTheDocument();
    expect(screen.getByText('Deploy your village')).toBeInTheDocument();

    expect(localStorage.getItem('email')).toBe('ada@example.com');
    expect(
      JSON.parse(localStorage.getItem('closer:application-answers') || ''),
    ).toEqual({
      _id: 'app-1',
      name: 'Ada',
      email: 'ada@example.com',
      fields: { projectCommunityName: 'Solarpunk Village' },
    });

    await user.click(screen.getByRole('button', { name: 'Create my account' }));
    expect(setIsOpen).toHaveBeenCalledWith(false);
    expect(pushMock()).toHaveBeenCalledWith('/signup?back=%2Fsubscriptions');
  });

  it('stops at the subscription when villages are not enabled', async () => {
    mockedUseAuth.mockReturnValue({ isAuthenticated: false });

    renderModal();
    await submitApplication();

    expect(screen.getByText('Subscribe')).toBeInTheDocument();
    expect(screen.queryByText('Create your village')).not.toBeInTheDocument();
    expect(screen.queryByText('Deploy your village')).not.toBeInTheDocument();
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

  it('stores the website or deck link as an absolute URL for the village', async () => {
    mockedUseAuth.mockReturnValue({ isAuthenticated: false });

    renderModal();
    const user = userEvent.setup();
    await user.type(
      screen.getByPlaceholderText('Link to your website or deck'),
      'riverbank.pt/deck',
    );
    await submitApplication();

    expect((api as unknown as { post: jest.Mock }).post).toHaveBeenCalledWith(
      '/application',
      expect.objectContaining({
        fields: {
          projectCommunityName: 'Solarpunk Village',
          website: 'https://riverbank.pt/deck',
        },
      }),
    );
  });

  it('refuses a link that cannot become a URL', async () => {
    mockedUseAuth.mockReturnValue({ isAuthenticated: false });

    renderModal();
    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText('Full Name'), 'Ada');
    await user.type(
      screen.getByPlaceholderText('Email Address'),
      'ada@example.com',
    );
    await user.type(
      screen.getByPlaceholderText('Project/Community Name'),
      'Solarpunk Village',
    );
    await user.type(
      screen.getByPlaceholderText('Link to your website or deck'),
      'not a link',
    );
    await user.click(
      screen.getByRole('button', { name: 'Launch your community' }),
    );

    expect(
      await screen.findByText('Please enter a valid link'),
    ).toBeInTheDocument();
    expect((api as unknown as { post: jest.Mock }).post).not.toHaveBeenCalled();
  });

  it('shows a signed-in member instead of asking their name and email', async () => {
    mockedUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { _id: 'u1', screenname: 'Ada Lovelace', email: 'ada@example.com' },
    });

    renderModal();

    expect(screen.queryByPlaceholderText('Full Name')).not.toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText('Email Address'),
    ).not.toBeInTheDocument();
    const preview = screen.getByTestId('signed-in-applicant');
    expect(preview).toHaveTextContent('Ada Lovelace');
    expect(preview).toHaveTextContent('ada@example.com');

    const user = userEvent.setup();
    await user.type(
      screen.getByPlaceholderText('Project/Community Name'),
      'Solarpunk Village',
    );
    await user.click(
      screen.getByRole('button', { name: 'Launch your community' }),
    );
    await waitFor(() => {
      expect(screen.getByText('You’re on the list')).toBeInTheDocument();
    });

    // The application is signed with the account, not a retyped identity.
    expect((api as unknown as { post: jest.Mock }).post).toHaveBeenCalledWith(
      '/application',
      expect.objectContaining({
        name: 'Ada Lovelace',
        email: 'ada@example.com',
      }),
    );
  });

  it('lets the applicant wait for the reply instead', async () => {
    mockedUseAuth.mockReturnValue({ isAuthenticated: false });

    renderModal();
    const user = await submitApplication();

    await user.click(
      screen.getByRole('button', { name: 'I’ll wait for your reply' }),
    );
    expect(setIsOpen).toHaveBeenCalledWith(false);
    expect(pushMock()).not.toHaveBeenCalled();
  });

  it('still stores answers when the API does not return an application id', async () => {
    mockedUseAuth.mockReturnValue({ isAuthenticated: false });
    (api.post as jest.Mock).mockResolvedValueOnce({ data: {} });

    renderModal();
    await submitApplication();

    expect(
      JSON.parse(localStorage.getItem('closer:application-answers') || ''),
    ).toEqual({
      name: 'Ada',
      email: 'ada@example.com',
      fields: { projectCommunityName: 'Solarpunk Village' },
    });
  });
});
