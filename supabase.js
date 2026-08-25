import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://yphnssxusoknuhodenno.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_QhPyfIKbbv-i3yHgIw3-7w_dI4xERwB';

// Export a single, reusable database instance
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);