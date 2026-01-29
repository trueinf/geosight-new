-- Supabase Migration SQL
-- Run this in your Supabase SQL Editor to create the tables

-- Create search_results table
CREATE TABLE IF NOT EXISTS search_results (
  id BIGSERIAL PRIMARY KEY,
  keyword TEXT NOT NULL,
  provider TEXT NOT NULL,
  query_text TEXT NOT NULL,
  results_json JSONB NOT NULL,
  ranking_analysis_json JSONB,
  improvement_recommendations_json JSONB,
  keyword_position INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  search_timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create scheduled_searches table
CREATE TABLE IF NOT EXISTS scheduled_searches (
  id BIGSERIAL PRIMARY KEY,
  keywords TEXT NOT NULL,
  keywords_list TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create brand_rankings table
CREATE TABLE IF NOT EXISTS brand_rankings (
  id BIGSERIAL PRIMARY KEY,
  keyword TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  provider TEXT NOT NULL,
  rank INTEGER,
  result_id BIGINT REFERENCES search_results(id) ON DELETE CASCADE,
  search_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_search_results_keyword ON search_results(keyword);
CREATE INDEX IF NOT EXISTS idx_search_results_provider ON search_results(provider);
CREATE INDEX IF NOT EXISTS idx_search_results_timestamp ON search_results(search_timestamp);
CREATE INDEX IF NOT EXISTS idx_brand_rankings_brand ON brand_rankings(brand_name);
CREATE INDEX IF NOT EXISTS idx_brand_rankings_keyword ON brand_rankings(keyword);

-- Enable Row Level Security (RLS) - adjust policies as needed
ALTER TABLE search_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_rankings ENABLE ROW LEVEL SECURITY;

-- Create policies to allow service role full access
CREATE POLICY "Service role full access on search_results" ON search_results
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on scheduled_searches" ON scheduled_searches
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on brand_rankings" ON brand_rankings
  FOR ALL USING (true) WITH CHECK (true);
