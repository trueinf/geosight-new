# Supabase Setup Instructions

## 1. Create Tables in Supabase

Go to your Supabase dashboard: https://supabase.com/dashboard/project/hvcbkajvnjupvulgsbdy

1. Navigate to **SQL Editor**
2. Run the SQL from `supabase-migration.sql` to create the tables

## 2. Environment Variables

Add these to your `.env` file:

```env
SUPABASE_URL=https://hvcbkajvnjupvulgsbdy.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2Y2JrYWp2bmp1cHZ1bGdzYmR5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTUxNDI3NywiZXhwIjoyMDg1MDkwMjc3fQ.SFV4iox7cWOGanGQkgC9VfLudD-KeZRJH0VHDjESaAI
```

## 3. Tables Created

- `search_results` - Stores LLM search results
- `scheduled_searches` - Manages scheduled keyword searches  
- `brand_rankings` - Tracks brand rankings over time

## 4. Row Level Security (RLS)

The migration SQL includes RLS policies that allow the service role full access. Adjust these policies in the Supabase dashboard under **Authentication > Policies** if you need different access controls.
