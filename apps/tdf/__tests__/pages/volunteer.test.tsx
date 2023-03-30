import { closerConfig } from '@/../../packages/closer/config';

import { render, screen } from '@testing-library/react';
import {
  AuthProvider,
  ConfigProvider,
  PlatformProvider,
  blockchainConfig,
} from 'closer';

import ImpactMapPage from '../../pages/volunteer/index';


describe('Volunteer', () => {
  it('should render and have proper title', () => {
    render(
      <ConfigProvider config={{ ...closerConfig, ...blockchainConfig }}>
        <AuthProvider>
          <PlatformProvider>
            <ImpactMapPage />
          </PlatformProvider>
        </AuthProvider>
      </ConfigProvider>,
    );

    const title = screen.getByRole('heading', { level: 1 });

    expect(title).toHaveTextContent(/volunteer at/i);
  });
});
