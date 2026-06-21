import { createClient } from '@supabase/supabase-js';

// Clean the Supabase API URL in case it has trailing slashes or path fragments
const rawUrl = import.meta.env.VITE_SUPABASE_URL || 'https://znxegzinakvnnkugfskn.supabase.co';
const cleanUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').trim().replace(/\/$/, "");

const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpueGVnemluYWt2bm5rdWdmc2tuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNDE2MTcsImV4cCI6MjA5NzYxNzYxN30.fX36T10G7Xzdo9X0k6-oYMfdXcTerRZesc4wq0heYuE';

export const supabase = createClient(cleanUrl, anonKey);
