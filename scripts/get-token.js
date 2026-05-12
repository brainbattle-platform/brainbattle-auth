import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'ngochannt1904@gmail.com',
    password: '@123456789',
  });

  if (error) {
    console.error(error);
    return;
  }

  console.log(data.session.access_token);
}

main();