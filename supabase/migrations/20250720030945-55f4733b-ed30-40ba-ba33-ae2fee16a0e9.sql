-- Create FAQ questions table for predefined Q&A pairs
CREATE TABLE public.faq_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create conversation messages table for individual messages
CREATE TABLE public.conversation_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.support_conversations(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'admin')),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.faq_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for faq_questions (readable by everyone, only admins can modify)
CREATE POLICY "FAQ questions are viewable by everyone" 
ON public.faq_questions 
FOR SELECT 
USING (is_active = true);

-- RLS policies for conversation_messages
CREATE POLICY "Users can view messages from their own conversations" 
ON public.conversation_messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.support_conversations 
    WHERE id = conversation_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create messages in their own conversations" 
ON public.conversation_messages 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.support_conversations 
    WHERE id = conversation_id AND user_id = auth.uid()
  )
);

-- Add trigger for updating timestamps
CREATE TRIGGER update_faq_questions_updated_at
BEFORE UPDATE ON public.faq_questions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update support_conversations to track if it started from FAQ
ALTER TABLE public.support_conversations 
ADD COLUMN faq_question_id UUID REFERENCES public.faq_questions(id),
ADD COLUMN is_resolved BOOLEAN NOT NULL DEFAULT false;

-- Insert some sample FAQ questions
INSERT INTO public.faq_questions (question, answer) VALUES
('How do I track my order?', 'You can track your order by going to the Orders section in your dashboard. Each order will show its current status and estimated delivery time.'),
('What is your return policy?', 'We offer a 30-day return policy for unused items in their original packaging. Please contact support to initiate a return.'),
('How can I change my delivery address?', 'You can change your delivery address before your order is shipped by contacting our support team or updating it in your order details.'),
('What payment methods do you accept?', 'We accept all major credit cards, PayPal, and bank transfers. All payments are processed securely.'),
('How do I cancel my order?', 'Orders can be cancelled within 24 hours of placement. After that, please contact support to discuss your options.');