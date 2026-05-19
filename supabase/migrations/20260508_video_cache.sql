-- Migration: Create video_cache table for YouTube API response caching
-- Run this in your Supabase SQL Editor or via supabase db push

CREATE TABLE IF NOT EXISTS video_cache (
  topic       TEXT PRIMARY KEY,
  video_url   TEXT NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Optional: index for fast lookups (PRIMARY KEY already creates one on topic)
-- Rows are upserted with onConflict: 'topic' from the API route

COMMENT ON TABLE video_cache IS
  '30-day cache for YouTube video URLs fetched via YouTube Data API v3. '
  'Keyed by DSA topic name. Refreshed automatically by /api/dsa-video.';
