import Signup from '@/pages/signup';
import { renderWithAuth } from '@/test/utils';

import { screen } from '@testing-library/react';

describe('Signup', () => {
  it('should have proper heading', () => {
    renderWithAuth(<Signup />);

    const title = screen.getByRole('heading', { level: 1 });
    expect(title).toHaveTextContent(/join our regenerative village/i);
  });

  it('should have a Continue button disabled by default', () => {
    renderWithAuth(<Signup />);

    const button = screen.getByRole('button', { name: /^continue$/i });

    expect(button).toBeDisabled();
  });
});
