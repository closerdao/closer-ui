import { renderWithProviders } from '@/test/utils';

import { screen } from '@testing-library/react';

import ForgotPasswordScreen from '../../../pages/login/forgot-password';

describe('Forgot password', () => {
  it('should render reset password button', () => {
    renderWithProviders(<ForgotPasswordScreen />);
    const button = screen.getByRole('button', { name: /reset password/i });
    expect(button).toBeInTheDocument();
  });
});
