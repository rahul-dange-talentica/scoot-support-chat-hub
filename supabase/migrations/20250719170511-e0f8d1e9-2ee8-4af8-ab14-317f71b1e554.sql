-- Create support_conversations table
CREATE TABLE public.support_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT NOT NULL DEFAULT 'medium',
  last_message TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  order_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  total_amount DECIMAL(10,2) NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  delivery_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.support_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for support_conversations
CREATE POLICY "Users can view their own conversations" 
ON public.support_conversations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations" 
ON public.support_conversations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" 
ON public.support_conversations 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create RLS policies for orders
CREATE POLICY "Users can view their own orders" 
ON public.orders 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_support_conversations_updated_at
BEFORE UPDATE ON public.support_conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample data for testing
INSERT INTO public.support_conversations (user_id, title, status, priority, last_message, last_message_at) VALUES
('e819ce41-9e0c-4464-947c-b6759116efc1', 'Battery not charging properly', 'open', 'high', 'I will send a technician to check your scooter tomorrow.', now() - interval '2 hours'),
('e819ce41-9e0c-4464-947c-b6759116efc1', 'Questions about warranty', 'resolved', 'low', 'Thank you for clarifying the warranty terms.', now() - interval '1 day');

INSERT INTO public.orders (user_id, order_number, status, total_amount, items, delivery_address) VALUES
('e819ce41-9e0c-4464-947c-b6759116efc1', 'ORD-2024-001', 'delivered', 45000.00, '[{"name": "Electric Scooter Model X", "quantity": 1, "price": 45000}]', '123 Main Street, Mumbai'),
('e819ce41-9e0c-4464-947c-b6759116efc1', 'ORD-2024-002', 'shipped', 2500.00, '[{"name": "Helmet", "quantity": 1, "price": 1500}, {"name": "Lock", "quantity": 1, "price": 1000}]', '123 Main Street, Mumbai');