function readString(name: string, fallback = ''): string {
  return process.env[name]?.trim() || fallback;
}

function readNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;

  const value = Number(raw);
  if (Number.isNaN(value)) {
    throw new Error(`Invalid environment variable ${name}: expected number`);
  }

  return value;
}

function requireString(name: string): string {
  const value = readString(name);

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const env = {
  nodeEnv: readString('NODE_ENV', 'development'),
  port: readNumber('PORT', 3000),

  databaseUrl: requireString('DATABASE_URL'),

  supabaseUrl: requireString('SUPABASE_URL'),
  supabaseAnonKey: requireString('SUPABASE_ANON_KEY'),
  supabaseServiceRoleKey: requireString('SUPABASE_SERVICE_ROLE_KEY'),

  internalServiceKey: readString('INTERNAL_SERVICE_KEY', 'dev-internal-key'),
};

export function validateEnv() {
  if (env.nodeEnv === 'production' && env.internalServiceKey === 'dev-internal-key') {
    throw new Error(
      'INTERNAL_SERVICE_KEY must not use the default dev value in production',
    );
  }

  return env;
}