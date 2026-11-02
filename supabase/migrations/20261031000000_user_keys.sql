-- Account master keys for end-to-end encryption.
-- Each member has one random 256-bit master key, generated in the browser.
-- The server only ever holds it wrapped (AES-GCM encrypted) twice:
--   wrapped_by_password  by a key derived on the device from the login password
--   wrapped_by_recovery  by a key derived from the 24 word recovery phrase
-- Neither the password, the phrase nor the master key ever reaches the server.
--
-- Apply with: supabase db push  OR  paste into Supabase SQL editor

CREATE TABLE IF NOT EXISTS user_keys (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  version int NOT NULL DEFAULT 1,
  -- Fingerprint of the master key, so a device can tell its cached key matches
  key_id text NOT NULL,
  -- Random per user salt for the "enc" key derivation (base64)
  kdf_salt text NOT NULL,
  wrapped_by_password text NOT NULL,
  wrapped_by_recovery text,
  recovery_confirmed_at timestamptz,
  -- Set after a password reset on a device without the key: a device that
  -- still holds the key re-wraps it once the member enters the new password
  needs_rewrap boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_keys" ON user_keys;
CREATE POLICY "users_own_keys" ON user_keys
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
