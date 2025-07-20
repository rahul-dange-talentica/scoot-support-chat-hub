-- Update user role to admin
UPDATE public.profiles 
SET role = 'admin' 
WHERE user_id = 'e819ce41-9e0c-4464-947c-b6759116efc1';

-- Add RLS policies for admin access to conversations
CREATE POLICY "Admins can view all conversations" 
ON public.support_conversations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update all conversations" 
ON public.support_conversations 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Add RLS policies for admin access to conversation messages
CREATE POLICY "Admins can view all conversation messages" 
ON public.conversation_messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can create messages in any conversation" 
ON public.conversation_messages 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Add RLS policies for admin access to FAQ questions
CREATE POLICY "Admins can insert FAQ questions" 
ON public.faq_questions 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update FAQ questions" 
ON public.faq_questions 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete FAQ questions" 
ON public.faq_questions 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);