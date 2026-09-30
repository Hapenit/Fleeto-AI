export function validateProductionEnvironment(
  environment: NodeJS.ProcessEnv,
): void {
  if (environment.NODE_ENV !== 'production') return;

  const errors: string[] = [];
  if (!environment.DATABASE_URL) errors.push('DATABASE_URL is required');
  if (!/^postgres(ql)?:\/\//.test(environment.DATABASE_URL ?? '')) {
    errors.push('DATABASE_URL must use PostgreSQL');
  }

  const jwtSecret = environment.JWT_ACCESS_SECRET;
  if (!jwtSecret || jwtSecret.length < 32 || jwtSecret.includes('development')) {
    errors.push('JWT_ACCESS_SECRET must be a unique secret of at least 32 characters');
  }

  const frontendOrigins = (environment.FRONTEND_URL ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (frontendOrigins.length === 0) {
    errors.push('FRONTEND_URL must contain at least one HTTPS frontend origin');
  }
  for (const origin of frontendOrigins) {
    try {
      const parsedOrigin = new URL(origin);
      if (
        parsedOrigin.protocol !== 'https:' ||
        parsedOrigin.origin !== origin ||
        parsedOrigin.username ||
        parsedOrigin.password
      ) {
        errors.push('Each FRONTEND_URL entry must be an HTTPS origin without credentials or a path');
      }
    } catch {
      errors.push('Each FRONTEND_URL entry must be a valid HTTPS origin');
    }
  }

  if (errors.length > 0) {
    throw new Error(`Invalid production configuration:\n- ${errors.join('\n- ')}`);
  }
}
