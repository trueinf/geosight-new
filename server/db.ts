import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "https://hvcbkajvnjupvulgsbdy.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2Y2JrYWp2bmp1cHZ1bGdzYmR5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTUxNDI3NywiZXhwIjoyMDg1MDkwMjc3fQ.SFV4iox7cWOGanGQkgC9VfLudD-KeZRJH0VHDjESaAI";

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default supabase;
