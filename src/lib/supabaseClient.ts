import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error(
        "Missing Supabase config. Copy .env.example to .env and fill it in."
    );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export { normalizeUid } from "./uid";
