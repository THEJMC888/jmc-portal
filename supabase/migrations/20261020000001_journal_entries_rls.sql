-- RLS policies for journal_entries
-- Each user can only read and write their own entries. The user_id column
-- must already be populated on INSERT (the app does this via syncToSupabase).
--
-- Apply with: supabase db push  OR  paste into Supabase SQL editor

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- Full access scoped to the owner
CREATE POLICY "users_own_journal_entries" ON journal_entries
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
