-- Fix trigger dependencies and implement comprehensive features

-- First, drop all existing triggers that depend on the function
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_bookings_updated_at ON public.bookings;
DROP TRIGGER IF EXISTS update_reviews_updated_at ON public.reviews;
DROP TRIGGER IF EXISTS update_admin_users_updated_at ON public.admin_users;

-- Drop existing trigger function
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Create improved trigger function for tables that have updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate the original triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add fuel_type and more car attributes for better filtering
ALTER TABLE public.cars 
ADD COLUMN IF NOT EXISTS fuel_type text DEFAULT 'Petrol',
ADD COLUMN IF NOT EXISTS transmission text DEFAULT 'Manual',
ADD COLUMN IF NOT EXISTS seating_capacity integer DEFAULT 5,
ADD COLUMN IF NOT EXISTS location text DEFAULT 'Main Office',
ADD COLUMN IF NOT EXISTS rating numeric DEFAULT 4.5,
ADD COLUMN IF NOT EXISTS total_reviews integer DEFAULT 0;

-- Create admin users table
CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL DEFAULT 'admin',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS for admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Create policies for admin_users
DROP POLICY IF EXISTS "Only admins can view admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Only admins can manage admin users" ON public.admin_users;

CREATE POLICY "Only admins can view admin users" 
ON public.admin_users 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au 
    WHERE au.user_id = auth.uid()
  )
);

CREATE POLICY "Only admins can manage admin users" 
ON public.admin_users 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au 
    WHERE au.user_id = auth.uid()
  )
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  car_id uuid REFERENCES public.cars(id) ON DELETE CASCADE NOT NULL,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS for reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for reviews
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can create their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;

CREATE POLICY "Anyone can view reviews" 
ON public.reviews 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own reviews" 
ON public.reviews 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" 
ON public.reviews 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create triggers for new tables with updated_at columns
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update car ratings
CREATE OR REPLACE FUNCTION public.update_car_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Update car rating and review count
  UPDATE public.cars
  SET 
    rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM public.reviews
      WHERE car_id = COALESCE(NEW.car_id, OLD.car_id)
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM public.reviews
      WHERE car_id = COALESCE(NEW.car_id, OLD.car_id)
    )
  WHERE id = COALESCE(NEW.car_id, OLD.car_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger to update car ratings when reviews change
DROP TRIGGER IF EXISTS update_car_rating_trigger ON public.reviews;
CREATE TRIGGER update_car_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_car_rating();

-- Update cars table with additional data
UPDATE public.cars 
SET 
  fuel_type = CASE 
    WHEN category = 'SUV' THEN 'Diesel'
    WHEN category = 'Sedan' THEN 'Petrol'
    ELSE 'Petrol'
  END,
  transmission = CASE 
    WHEN category = 'SUV' THEN 'Automatic'
    ELSE 'Manual'
  END,
  seating_capacity = CASE 
    WHEN category = 'SUV' THEN 7
    WHEN category = 'Sedan' THEN 5
    ELSE 5
  END
WHERE fuel_type IS NULL OR transmission IS NULL OR seating_capacity IS NULL;

-- Add real-time capabilities
ALTER TABLE public.cars REPLICA IDENTITY FULL;
ALTER TABLE public.bookings REPLICA IDENTITY FULL;
ALTER TABLE public.reviews REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE admin_users.user_id = $1
  );
$$;