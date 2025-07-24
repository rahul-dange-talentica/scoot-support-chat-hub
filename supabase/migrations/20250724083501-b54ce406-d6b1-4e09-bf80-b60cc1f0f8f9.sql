-- Create storage bucket for conversation attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('conversation-attachments', 'conversation-attachments', false);

-- Create storage policies for conversation attachments
CREATE POLICY "Users can upload files to their own conversations" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'conversation-attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view files from their own conversations" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'conversation-attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all conversation files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'conversation-attachments' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Add file attachment columns to conversation_messages table
ALTER TABLE conversation_messages 
ADD COLUMN file_url text,
ADD COLUMN file_name text,
ADD COLUMN file_type text,
ADD COLUMN file_size integer;