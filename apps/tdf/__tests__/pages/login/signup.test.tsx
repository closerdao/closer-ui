import Signup from '@/pages/signup';

import { render, screen } from '@testing-library/react';
import { AuthProvider } from 'closer';

describe('Signup', () => {
  it('should have sign up button enabled', () => {
    render(
      <AuthProvider>
        <Signup />
      </AuthProvider>,
    );

    const title = screen.getByRole('heading', { level: 1 });
    expect(title).toHaveTextContent(/signup/i);
  });

  it('should have a Create account button disabled by default', () => {
    render(
      <AuthProvider>
        <Signup />
      </AuthProvider>,
    );
    const button = screen.getByRole('button', { name: /create account/i });

    expect(button).toBeDisabled();
  });

});
