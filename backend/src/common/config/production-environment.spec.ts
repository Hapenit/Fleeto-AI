import { validateProductionEnvironment } from './production-environment.js';

describe('validateProductionEnvironment', () => {
  const validEnvironment = {
    NODE_ENV: 'production',
    DATABASE_URL: 'postgresql://app:password@db.example.com/fleeto',
    JWT_ACCESS_SECRET: 'x'.repeat(48),
    FRONTEND_URL: 'https://app.example.com',
  };

  it('accepts valid production settings', () => {
    expect(() => validateProductionEnvironment(validEnvironment)).not.toThrow();
  });

  it('does not require production-only settings in development', () => {
    expect(() => validateProductionEnvironment({ NODE_ENV: 'development' })).not.toThrow();
  });

  it('rejects missing secrets and non-HTTPS frontend origins', () => {
    expect(() =>
      validateProductionEnvironment({
        ...validEnvironment,
        JWT_ACCESS_SECRET: 'short',
        FRONTEND_URL: 'http://localhost:3000',
      }),
    ).toThrow(/JWT_ACCESS_SECRET.*FRONTEND_URL/s);
  });

  it('does not include the database connection string in errors', () => {
    expect(() =>
      validateProductionEnvironment({
        ...validEnvironment,
        DATABASE_URL: 'mysql://user:secret@db.example.com/fleeto',
      }),
    ).toThrow(/DATABASE_URL must use PostgreSQL/);
    try {
      validateProductionEnvironment({
        ...validEnvironment,
        DATABASE_URL: 'mysql://user:secret@db.example.com/fleeto',
      });
    } catch (error) {
      expect((error as Error).message).not.toContain('secret');
    }
  });
});
