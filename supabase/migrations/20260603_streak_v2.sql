-- Ensure streak V2 columns exist on the progress table
ALTER TABLE progress ADD COLUMN IF NOT EXISTS last_active_date TIMESTAMPTZ;
