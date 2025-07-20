-- Delete customer conversations for user who is now admin (919970396783)
DELETE FROM public.support_conversations 
WHERE user_id = 'e819ce41-9e0c-4464-947c-b6759116efc1';