import {  screen } from '@testing-library/react';


import HomePage from '../../pages/index';
import { renderWithProviders } from '@/test/utils';

describe('HomePage', () => {
  it('should render and have a title', () => {


    renderWithProviders(<HomePage />)

    const title = screen.getByRole('heading', { level: 1 });
    expect(title).toHaveTextContent(
      /SOIL AND SOULS REGENERATING LIFE TOGETHER/i,
    );
  });
});
