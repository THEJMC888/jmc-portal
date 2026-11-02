-- Encrypted vault for member content that used to live only on one device:
-- Statements, Vision Videos, Attunement cards, Blueprint profile fields,
-- plus journal media and the Vision photo and music libraries as files.
--
-- Every data column and every Storage object is ciphertext, sealed in the
-- browser with the member's account key (see src/lib/e2ee.ts). The server
-- sees only the kind of item, its random id, its size and when it changed.
--
-- Apply with: supabase db push  OR  paste into Supabase SQL editor

CREATE TABLE IF NOT EXISTS user_vault (
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  kind text NOT NULL,          -- statement | vision | attunement | blueprint | photo | music
  item_id text NOT NULL,
  data text,                   -- "e2:" sealed JSON; null once deleted
  deleted boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, kind, item_id)
);

ALTER TABLE user_vault ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_vault" ON user_vault;
CREATE POLICY "users_own_vault" ON user_vault
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Journal media list (sealed JSON of file references in Storage)
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS media text;

-- Private bucket for sealed files. Each member may only touch their own folder.
INSERT INTO storage.buckets (id, name, public)
VALUES ('vault', 'vault', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "vault_owner_select" ON storage.objects;
DROP POLICY IF EXISTS "vault_owner_insert" ON storage.objects;
DROP POLICY IF EXISTS "vault_owner_update" ON storage.objects;
DROP POLICY IF EXISTS "vault_owner_delete" ON storage.objects;
CREATE POLICY "vault_owner_select" ON storage.objects FOR SELECT
  USING (bucket_id = 'vault' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "vault_owner_insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'vault' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "vault_owner_update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'vault' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "vault_owner_delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'vault' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Live sync between open devices (payloads are ciphertext; RLS still applies)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    RETURN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'user_vault') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE user_vault;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'journal_entries') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE journal_entries;
  END IF;
END $$;
