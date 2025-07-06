import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY

console.log('VITE_SUPABASE_URL:', supabaseUrl);
console.log('VITE_SUPABASE_KEY (first 10 chars):', supabaseKey ? supabaseKey.substring(0, 10) + '...' : 'undefined/empty');

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase URL or Key is missing from environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseKey) 