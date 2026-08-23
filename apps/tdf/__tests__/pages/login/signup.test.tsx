import Signup from '@/pages/signup';
import { renderWithAuth } from '@/test/utils';

import { screen } from '@testing-library/react';

describe('Signup', () => {
  it('should have proper heading', () => {
    renderWithAuth(<Signup />);

    const title = screen.getByRole('heading', { level: 1 });
    expect(title).toHaveTextContent(/sign up/i);
  });

  it('should collect name, email and password on a single screen', () => {
    renderWithAuth(<Signup />);

    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('should have the submit button disabled until the form is filled in', () => {
    renderWithAuth(<Signup />);

    const button = screen.getByRole('button', { name: /^sign up$/i });

    expect(button).toBeDisabled();
  });
});
