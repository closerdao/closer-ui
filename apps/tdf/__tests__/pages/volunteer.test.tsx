import { closerConfig } from '@/../../packages/closer/config';

import { render, screen } from '@testing-library/react';
import {
  AuthProvider,
  ConfigProvider,
  PlatformProvider,
  blockchainConfig,
} from 'closer';

import VolunteerPage from '../../pages/volunteer';
import { volunteersMock } from '../mocks/volunteersMock';

describe('Volunteer', () => {
  it('should render and have proper title', () => {
    render(
      <ConfigProvider config={{ ...closerConfig, ...blockchainConfig }}>
        <AuthProvider>
          <PlatformProvider>
            <VolunteerPage opportunities={volunteersMock} />
          </PlatformProvider>
        </AuthProvider>
      </ConfigProvider>,
    );
    const title = screen.getByRole('heading', { level: 1 });

    expect(title).toHaveTextContent(/volunteer at TDF/i);
    const volCard = screen.getAllByTestId('volunteer-card');
    expect(volCard).toHaveLength(volunteersMock.length);
  });
});
