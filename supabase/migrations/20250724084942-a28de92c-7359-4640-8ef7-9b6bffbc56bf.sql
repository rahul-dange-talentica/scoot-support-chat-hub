-- Make the conversation-attachments bucket public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'conversation-attachments';

-- Create storage policies for the conversation-attachments bucket
-- Allow anyone to view/download files (since both customers and admins need access)
CREATE POLICY "Allow public access to conversation attachments" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'conversation-attachments');

-- Allow authenticated users to upload files to their own folder
CREATE POLICY "Allow authenticated users to upload conversation attachments" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'conversation-attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to update files in their own folder
CREATE POLICY "Allow authenticated users to update their conversation attachments" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'conversation-attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete files in their own folder
CREATE POLICY "Allow authenticated users to delete their conversation attachments" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'conversation-attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);