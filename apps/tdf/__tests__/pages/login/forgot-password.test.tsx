import { renderWithProviders } from '@/test/utils';

import { screen } from '@testing-library/react';

import ForgotPasswordScreen from '../../../pages/login/forgot-password';

describe('Forgot password', () => {
  it('should have reset password button enabled', () => {
    renderWithProviders(<ForgotPasswordScreen />);
    const button = screen.getByRole('button', { name: /reset password/i });
    expect(button).toBeEnabled();
  });
});
