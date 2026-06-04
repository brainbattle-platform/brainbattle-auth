import { env as configEnv } from '../config/env';

export const env = {
  SUPABASE_URL: configEnv.supabaseUrl,
  SUPABASE_SERVICE_ROLE_KEY: configEnv.supabaseServiceRoleKey,
  INTERNAL_SERVICE_KEY: configEnv.internalServiceKey,
  PORT: configEnv.port,
};