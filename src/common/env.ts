export const env = {
  SUPABASE_URL: process.env.SUPABASE_URL ?? '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  INTERNAL_SERVICE_KEY: process.env.INTERNAL_SERVICE_KEY ?? 'dev-internal-key',
  PORT: Number(process.env.PORT ?? 3000),
};