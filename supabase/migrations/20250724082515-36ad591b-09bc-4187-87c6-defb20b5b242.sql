-- Convert existing order amounts from USD to INR (multiply by 83)
UPDATE public.orders 
SET total_amount = total_amount * 83
WHERE total_amount > 0;