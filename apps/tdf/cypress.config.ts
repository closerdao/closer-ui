import { defineConfig } from 'cypress';
import dotenv from 'dotenv';

dotenv.config(); 

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {},
    env: {
      ...process.env,
    },
    baseUrl: 'http://localhost:3000',

    supportFile: false,
  },
  chromeWebSecurity: false, 

});
