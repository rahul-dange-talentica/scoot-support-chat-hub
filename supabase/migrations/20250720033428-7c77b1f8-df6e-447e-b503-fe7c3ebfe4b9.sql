-- Remove admin ability to update conversation status (only customers should resolve)
DROP POLICY IF EXISTS "Admins can update all conversations" ON public.support_conversations;