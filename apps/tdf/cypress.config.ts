import { defineConfig } from 'cypress';
import dotenv from 'dotenv';

dotenv.config(); 

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {},
    env: {
      ...process.env,
      MOCK_WEB3: true, // Enable Web3 mocking for token tests
    },
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
  },
  chromeWebSecurity: false,
  video: false, // Disable video recording for faster tests
  screenshotOnRunFailure: true,
});
