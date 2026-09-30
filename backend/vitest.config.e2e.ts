import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    env: {
      SARVAM_API_KEY: 'test_key',
      GEMINI_API_KEY: 'test_key',
      EXOTEL_API_KEY: 'test_key',
      EXOTEL_API_TOKEN: 'test_key',
      EXOTEL_SUBDOMAIN: 'test_domain'
    }
  },
});
