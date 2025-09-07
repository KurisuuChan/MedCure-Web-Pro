import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// For development: use dummy values if environment variables are not set
const developmentUrl = "https://dummy.supabase.co";
const developmentKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1bW15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDU5NzQwMDAsImV4cCI6MTk2MTU1MDAwMH0.dummy";

// Use environment variables if available, otherwise use development values
const finalUrl = supabaseUrl || developmentUrl;
const finalKey = supabaseAnonKey || developmentKey;

// In development mode without proper credentials, we'll create a mock client
export const supabase = createClient(finalUrl, finalKey, {
  auth: {
    persistSession: true, // Crucial for remembering the user
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

// Flag to indicate if we're using real Supabase or development mode
export const isProductionSupabase = Boolean(supabaseUrl && supabaseAnonKey);
