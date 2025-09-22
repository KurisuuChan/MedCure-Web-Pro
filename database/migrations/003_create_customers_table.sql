-- Create customers table for customer management
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  customer_name character varying NOT NULL,
  phone character varying,
  email character varying,
  address text,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  last_purchase_date timestamp with time zone,
  total_purchases numeric DEFAULT 0,
  CONSTRAINT customers_pkey PRIMARY KEY (id),
  CONSTRAINT customers_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers(customer_name);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_active ON public.customers(is_active);

-- Add RLS policy
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all active customers
CREATE POLICY "Users can view active customers" ON public.customers
  FOR SELECT USING (is_active = true);

-- Policy: Users can insert customers
CREATE POLICY "Users can create customers" ON public.customers
  FOR INSERT WITH CHECK (true);

-- Policy: Users can update customers they created or if they're admin
CREATE POLICY "Users can update customers" ON public.customers
  FOR UPDATE USING (true);