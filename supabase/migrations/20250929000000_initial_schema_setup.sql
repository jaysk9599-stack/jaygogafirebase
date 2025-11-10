/*
  # Initial Database Schema Setup
  This script creates the necessary tables, sets up relationships, and configures Row Level Security (RLS) for the Jay Goga Milk application.

  ## Query Description:
  This is a foundational setup script. It creates the `profiles`, `products`, `customers`, and `daily_orders` tables. It will not run if these tables already exist, but it is intended for a fresh database. It also sets up a trigger to automatically create a user profile upon registration. There is no risk to existing data if this is a new setup.

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "High"
  - Requires-Backup: false
  - Reversible: false

  ## Structure Details:
  - Creates table `public.profiles`
  - Creates table `public.products`
  - Creates table `public.customers`
  - Creates table `public.daily_orders`
  - Creates trigger `on_auth_user_created`
  - Creates function `public.handle_new_user`

  ## Security Implications:
  - RLS Status: Enabled on all new tables.
  - Policy Changes: Yes, creates policies for SELECT, INSERT, UPDATE, DELETE.
  - Auth Requirements: Policies are based on `auth.uid()`.

  ## Performance Impact:
  - Indexes: Primary keys and foreign keys are indexed automatically.
  - Triggers: Adds one trigger on `auth.users`.
  - Estimated Impact: Low, as this is for initial setup.
*/

-- Custom types
CREATE TYPE public.unit AS ENUM ('ml', 'L', 'gm', 'kg', 'piece');
CREATE TYPE public.order_status AS ENUM ('pending', 'delivered');

-- Profiles Table
-- Stores public user data.
CREATE TABLE public.profiles (
  id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  username text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  PRIMARY KEY (id)
);
COMMENT ON TABLE public.profiles IS 'Stores public user data, linked to authentication.';

-- Products Table
CREATE TABLE public.products (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name text NOT NULL,
  price numeric NOT NULL,
  quantity numeric NOT NULL,
  unit public.unit NOT NULL,
  photo text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.products IS 'Stores product information for each user.';

-- Customers Table
CREATE TABLE public.customers (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name text NOT NULL,
  address text NOT NULL,
  contact_number text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.customers IS 'Stores customer information for each user.';

-- Daily Orders Table
CREATE TABLE public.daily_orders (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers ON DELETE CASCADE,
  customer_name text NOT NULL,
  date date NOT NULL,
  items jsonb NOT NULL,
  total_amount numeric NOT NULL,
  amount_paid numeric DEFAULT 0 NOT NULL,
  status public.order_status DEFAULT 'pending'::public.order_status NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.daily_orders IS 'Stores daily order records for each customer.';

-- Function to create a profile for a new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (new.id, new.raw_user_meta_data->>'username');
  RETURN new;
END;
$$;

-- Trigger to call the function when a new user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Enable RLS for all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile." ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for products
CREATE POLICY "Users can manage their own products." ON public.products FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for customers
CREATE POLICY "Users can manage their own customers." ON public.customers FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for daily_orders
CREATE POLICY "Users can manage their own orders." ON public.daily_orders FOR ALL USING (auth.uid() = user_id);
