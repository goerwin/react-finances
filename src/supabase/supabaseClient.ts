import { createClient } from '@supabase/supabase-js';
import { SUPABASE_API_KEY, SUPABASE_PROJECT_URL } from './config';

const supabaseClient = createClient(SUPABASE_PROJECT_URL, SUPABASE_API_KEY);

export default supabaseClient;
