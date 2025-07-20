-- Remove admin ability to update conversation status (only customers should resolve)
DROP POLICY IF EXISTS "Admins can update all conversations" ON public.support_conversations;

-- Update conversation RLS to allow customers to resolve their own conversations
CREATE POLICY "Users can update their own conversations" 
ON public.support_conversations 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);