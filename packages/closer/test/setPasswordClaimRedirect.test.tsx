import { useRouter } from 'next/router';

import React from 'react';

import { fireEvent, screen } from '@testing-library/react';

import { useAuth } from '../contexts/auth';
import SetPasswordScreen from '../pages/login/set-password';
import { renderWithNextIntl } from './utils';

jest.mock('../contexts/auth', () => ({
  useAuth: jest.fn(),
}));

const signupToken = `header.${Buffer.from(
  JSON.stringify({ email: 'ada@riverbank.pt' }),
).toString('base64')}.signature`;

const submitWith = (claimedVillages: string[]) => {
  const push = jest.fn();
  (useRouter as jest.Mock).mockReturnValue({
    query: { signup_token: signupToken },
    push,
  });
  (useAuth as jest.Mock).mockReturnValue({
    isAuthenticated: false,
    error: null,
    updatePassword: jest.fn(),
    completeRegistration: jest.fn((_token, _data, onSuccess) =>
      onSuccess({ claimedVillages }),
    ),
  });
  const { container } = renderWithNextIntl(<SetPasswordScreen />);
  fireEvent.submit(container.querySelector('form') as HTMLFormElement);
  return push;
};

describe('finishing an invited signup', () => {
  it('lands the new owner on the village they claimed', () => {
    expect(submitWith(['v1'])).toHaveBeenCalledWith('/villages/v1');
  });

  it('goes home when the signup claimed nothing', () => {
    expect(submitWith([])).toHaveBeenCalledWith('/');
  });

  it('shows the invited address', () => {
    submitWith([]);
    expect(screen.getByText('ada@riverbank.pt')).toBeInTheDocument();
  });
});
