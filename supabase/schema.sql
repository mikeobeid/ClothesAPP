-- Wardrobe App: guest-mode cloud backup tables
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS clothes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  color TEXT NOT NULL,
  season TEXT[] NOT NULL DEFAULT '{}',
  occasion TEXT[] NOT NULL DEFAULT '{}',
  image_uri TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS clothes_user_id_idx ON clothes (user_id);

CREATE TABLE IF NOT EXISTS outfits (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  occasion TEXT NOT NULL,
  season TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS outfits_user_id_idx ON outfits (user_id);

CREATE TABLE IF NOT EXISTS outfit_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outfit_id TEXT NOT NULL REFERENCES outfits(id) ON DELETE CASCADE,
  clothing_id TEXT NOT NULL REFERENCES clothes(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  UNIQUE (outfit_id, clothing_id)
);

CREATE INDEX IF NOT EXISTS outfit_items_outfit_id_idx ON outfit_items (outfit_id);
CREATE INDEX IF NOT EXISTS outfit_items_user_id_idx ON outfit_items (user_id);

ALTER TABLE clothes ENABLE ROW LEVEL SECURITY;
ALTER TABLE outfits ENABLE ROW LEVEL SECURITY;
ALTER TABLE outfit_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "guest_clothes_all" ON clothes
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "guest_outfits_all" ON outfits
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "guest_outfit_items_all" ON outfit_items
  FOR ALL USING (true) WITH CHECK (true);
