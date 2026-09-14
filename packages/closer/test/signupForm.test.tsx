import React from 'react';

import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import SignupForm from '../components/SignupForm';
import { renderWithProviders } from './utils';

// WalletProvider dynamically imports its Reown implementation and swaps it in,
// which remounts everything below it. Let that land before touching the form,
// or the remount wipes whatever was just typed or toggled.
const renderSignupForm = async () => {
  renderWithProviders(<SignupForm />);
  await act(async () => {
    await Promise.resolve();
  });
};

const fillAccountForm = async (
  user: ReturnType<typeof userEvent.setup>,
  password = 'sup3rsecret',
) => {
  await user.type(screen.getByLabelText('Name'), 'Ada Lovelace');
  await user.type(screen.getByLabelText('Email'), 'ada@example.com');
  await user.type(screen.getByLabelText('Password'), password);
};

describe('SignupForm', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it('collects name, email and password on a single screen', async () => {
    await renderSignupForm();

    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^sign up$/i }),
    ).toBeDisabled();
  });

  it('states the password rules up front instead of failing on submit', async () => {
    const user = userEvent.setup();
    await renderSignupForm();

    expect(
      screen.getByText(/at least 5 characters, with one letter and one number/i),
    ).toBeInTheDocument();

    await fillAccountForm(user, 'nodigits');

    // A password that cannot pass validation never gets to cost a round trip.
    expect(screen.getByRole('button', { name: /^sign up$/i })).toBeDisabled();
  });

  it('enables signup once every field is valid', async () => {
    const user = userEvent.setup();
    await renderSignupForm();

    await fillAccountForm(user);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /^sign up$/i }),
      ).toBeEnabled();
    });
  });

  it('does not require email consent to continue', async () => {
    const user = userEvent.setup();
    await renderSignupForm();

    await fillAccountForm(user);
    await user.click(screen.getByLabelText(/i agree to be contacted via email/i));

    expect(screen.getByLabelText(/i agree to be contacted via email/i)).not.toBeChecked();
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /^sign up$/i }),
      ).toBeEnabled();
    });
  });

  it('reveals the password on request', async () => {
    const user = userEvent.setup();
    await renderSignupForm();

    expect(screen.getByLabelText('Password')).toHaveAttribute(
      'type',
      'password',
    );

    await user.click(screen.getByRole('button', { name: /^show$/i }));

    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'text');
  });

  it('shows the optional profile step as skippable', async () => {
    sessionStorage.setItem('signup_step', 'profile');
    await renderSignupForm();

    await waitFor(() => {
      expect(screen.getByText(/anything you'd like us to know/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /skip for now/i })).toBeEnabled();
  });

  it('keeps users of the previous numbered flow on the profile step', async () => {
    sessionStorage.setItem('signup_step', '3');
    await renderSignupForm();

    await waitFor(() => {
      expect(screen.getByText(/anything you'd like us to know/i)).toBeInTheDocument();
    });
  });

  it('sends users who were mid account creation back to the single form', async () => {
    sessionStorage.setItem('signup_step', '2');
    await renderSignupForm();

    await waitFor(() => {
      expect(screen.getByLabelText('Name')).toBeInTheDocument();
    });
  });
});
