-- RLS policies for coaching_sessions
-- Members see only their own sessions; admin sees all; service role (webhook) bypasses RLS.
--
-- Apply with: supabase db push  OR  paste into Supabase SQL editor

ALTER TABLE coaching_sessions ENABLE ROW LEVEL SECURITY;

-- Members see their own sessions; admin sees everything
CREATE POLICY "select_coaching_sessions" ON coaching_sessions
  FOR SELECT USING (
    member_email = auth.email()
    OR auth.email() = current_setting('app.admin_email', true)
  );

-- Admin can insert/update/delete from the client; service role (Fireflies webhook) bypasses RLS automatically
CREATE POLICY "admin_insert_coaching_sessions" ON coaching_sessions
  FOR INSERT WITH CHECK (auth.email() = current_setting('app.admin_email', true));

CREATE POLICY "admin_update_coaching_sessions" ON coaching_sessions
  FOR UPDATE USING (auth.email() = current_setting('app.admin_email', true));

CREATE POLICY "admin_delete_coaching_sessions" ON coaching_sessions
  FOR DELETE USING (auth.email() = current_setting('app.admin_email', true));

-- Set app.admin_email in Supabase dashboard → Settings → Database → Configuration
-- (or run: ALTER DATABASE postgres SET app.admin_email = 'rng@thejourneymencollective.com')
-- Fallback: replace current_setting(...) with a literal if the config is not set.
