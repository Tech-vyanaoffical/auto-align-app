-- Add real-time capabilities and additional tables for comprehensive features

-- Add fuel_type and more car attributes for better filtering
ALTER TABLE public.cars 
ADD COLUMN fuel_type text DEFAULT 'Petrol',
ADD COLUMN transmission text DEFAULT 'Manual',
ADD COLUMN seating_capacity integer DEFAULT 5,
ADD COLUMN location text DEFAULT 'Main Office',
ADD COLUMN rating numeric DEFAULT 4.5,
ADD COLUMN total_reviews integer DEFAULT 0;

-- Create admin users table
CREATE TABLE public.admin_users (
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

-- Create car availability tracking table
CREATE TABLE public.car_availability (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  car_id uuid REFERENCES public.cars(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  available boolean NOT NULL DEFAULT true,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(car_id, date)
);

-- Enable RLS for car_availability
ALTER TABLE public.car_availability ENABLE ROW LEVEL SECURITY;

-- Create policies for car_availability
CREATE POLICY "Anyone can view car availability" 
ON public.car_availability 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage car availability" 
ON public.car_availability 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au 
    WHERE au.user_id = auth.uid()
  )
);

-- Create reviews table
CREATE TABLE public.reviews (
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
CREATE TABLE public.notifications (
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
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add real-time capabilities
ALTER TABLE public.cars REPLICA IDENTITY FULL;
ALTER TABLE public.bookings REPLICA IDENTITY FULL;
ALTER TABLE public.reviews REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.car_availability REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.cars;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.car_availability;

-- Create triggers for updated_at columns
CREATE TRIGGER update_cars_updated_at
  BEFORE UPDATE ON public.cars
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

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
CREATE TRIGGER update_car_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_car_rating();

-- Insert some sample admin user (you can modify this)
-- This will make the first registered user an admin
INSERT INTO public.admin_users (user_id, role)
SELECT id, 'admin'
FROM auth.users
LIMIT 1
ON CONFLICT (user_id) DO NOTHING;

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
  END;

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