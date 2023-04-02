// write a smoke test for VolunteerCard
import React from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import mockRouter from 'next-router-mock';
import { MemoryRouterProvider } from 'next-router-mock/MemoryRouterProvider';

import VolunteerCard from './VolunteerCard';

describe('VolunteerCard', () => {
  it('should render name, description and dates', () => {
    render(
      <VolunteerCard
        photo="6428ca70fc792398aed73d58"
        name="Test"
        description="long description"
        startDate="2023-05-01T11:00:00.000Z"
        endDate="2023-05-05T11:00:00.000Z"
        slug="test"
      />,
    );

    const name = screen.getByText('Test');
    const description = screen.getByText('long description');
    const dates = screen.getByText('May 1st 12:00 - May 5th 12:00');
    const button = screen.getByRole('button', { name: 'Apply' });

    expect(name).toBeInTheDocument();
    expect(description).toBeInTheDocument();
    expect(dates).toBeInTheDocument();
    expect(button).toBeInTheDocument();
  });

  it('should take you to checkout if clicked on Apply', async () => {
    render(
      <MemoryRouterProvider>
        <VolunteerCard
          photo="6428ca70fc792398aed73d58"
          name="Test"
          description="long description"
          startDate="2023-05-01T11:00:00.000Z"
          endDate="2023-05-05T11:00:00.000Z"
          slug="test"
        />
      </MemoryRouterProvider>,
    );

    const applyBtn = screen.getByRole('button', { name: 'Apply' });
    await userEvent.click(applyBtn);

    expect(mockRouter.asPath).toBe('/volunteer/test/checkout');
  });
});
