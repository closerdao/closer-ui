import { render, screen } from '@testing-library/react';
import { AuthProvider } from 'closer';

import HomePage from '../../pages/index';

describe('HomePage', () => {
  it('should render and have a title', () => {
    render(
      <AuthProvider>
        <HomePage />
      </AuthProvider>,
    );

    const title = screen.getByTestId('page-title');
    expect(title).toHaveTextContent(
      'A playground for living and creating together',
    );
  });
});
