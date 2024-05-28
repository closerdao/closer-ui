import { closerConfig } from '@/../../packages/closer/config';

import { render, screen } from '@testing-library/react';
import {
  AuthProvider,
  ConfigProvider,
  PlatformProvider,
  blockchainConfig,
} from 'closer';

import VolunteerPage from '../../pages/volunteer';
import { volunteerEventMock } from '../mocks/volunteerEvent';

describe('Volunteer', () => {
  beforeEach(() => {
    // Mock environment variable
    process.env = Object.assign(process.env, { NEXT_PUBLIC_FEATURE_VOLUNTEERING: 'true' });
  });
  it('should render and have proper title', () => {
    const volunteerConfigMock = { enabled: true };

    const eventListMock = [volunteerEventMock];
    render(
      <ConfigProvider config={{ ...closerConfig, ...blockchainConfig }}>
        <AuthProvider>
          <PlatformProvider>
            <VolunteerPage opportunities={eventListMock} volunteerConfig={volunteerConfigMock} />
          </PlatformProvider>
        </AuthProvider>
      </ConfigProvider>,
    );
    const title = screen.getByRole('heading', { level: 1 });

    expect(title).toHaveTextContent(/Volunteering Opportunities/i);
  });
});
