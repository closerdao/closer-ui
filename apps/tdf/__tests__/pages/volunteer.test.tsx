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
  it('should render and have proper title', () => {
    const eventListMock = [volunteerEventMock];
    render(
      <ConfigProvider config={{ ...closerConfig, ...blockchainConfig }}>
        <AuthProvider>
          <PlatformProvider>
            <VolunteerPage opportunities={eventListMock} />
          </PlatformProvider>
        </AuthProvider>
      </ConfigProvider>,
    );
    const title = screen.getByRole('heading', { level: 1 });

    expect(title).toHaveTextContent(/Volunteering Opportunities/i);
  });
});
