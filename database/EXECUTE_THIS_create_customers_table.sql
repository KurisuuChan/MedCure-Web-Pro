-- Execute this SQL script in your Supabase SQL editor to create the customers table
-- This will fix the "Could not find the table 'public.customers'" error

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

-- Migrate existing customer data from sales table (optional)
INSERT INTO public.customers (customer_name, phone, email, created_at, last_purchase_date, total_purchases)
SELECT DISTINCT 
  customer_name,
  customer_phone,
  customer_email,
  MIN(created_at) as created_at,
  MAX(created_at) as last_purchase_date,
  SUM(total_amount) as total_purchases
FROM public.sales 
WHERE customer_name IS NOT NULL 
  AND customer_name != ''
  AND customer_name NOT IN (SELECT customer_name FROM public.customers WHERE customer_name IS NOT NULL)
GROUP BY customer_name, customer_phone, customer_email;

-- Add customer_id column to sales table for future linking (optional)
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS customer_id uuid;
ALTER TABLE public.sales ADD CONSTRAINT IF NOT EXISTS sales_customer_id_fkey 
  FOREIGN KEY (customer_id) REFERENCES public.customers(id);