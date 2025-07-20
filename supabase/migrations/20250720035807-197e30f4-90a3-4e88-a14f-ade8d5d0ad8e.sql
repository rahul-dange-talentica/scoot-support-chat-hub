-- Add order_id to support_conversations to link conversations to orders
ALTER TABLE public.support_conversations 
ADD COLUMN order_id uuid REFERENCES public.orders(id);

-- Update RLS policies for admins to update orders
CREATE POLICY "Admins can view all orders" 
ON public.orders 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'admin'
));

CREATE POLICY "Admins can update all orders" 
ON public.orders 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'admin'
));

-- Add some sample scooter data for orders
CREATE TABLE IF NOT EXISTS public.scooters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  model text NOT NULL,
  price numeric NOT NULL,
  description text,
  image_url text,
  is_available boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on scooters table
ALTER TABLE public.scooters ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view available scooters
CREATE POLICY "Scooters are viewable by everyone" 
ON public.scooters 
FOR SELECT 
USING (is_available = true);

-- Allow admins to manage scooters
CREATE POLICY "Admins can manage scooters" 
ON public.scooters 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'admin'
));

-- Insert sample scooter data
INSERT INTO public.scooters (name, model, price, description, image_url) VALUES
('Urban Cruiser', 'UC-2024', 599.99, 'Perfect for city commuting with 25km range', '/placeholder.svg'),
('Speed Demon', 'SD-Pro', 899.99, 'High-performance scooter with 40km range', '/placeholder.svg'),
('Eco Rider', 'ER-Green', 449.99, 'Eco-friendly option with solar charging', '/placeholder.svg'),
('Mountain Explorer', 'ME-Tough', 1199.99, 'All-terrain scooter for adventurous rides', '/placeholder.svg');