-- First, create a profiles table to manage user access
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'employee',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create a function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (NEW.id, 'employee');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create security definer function to check user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can delete clientes" ON public.clientes;
DROP POLICY IF EXISTS "Authenticated users can insert clientes" ON public.clientes;
DROP POLICY IF EXISTS "Authenticated users can update clientes" ON public.clientes;
DROP POLICY IF EXISTS "Authenticated users can view clientes" ON public.clientes;

-- Create secure RLS policies for clientes (all authenticated users can manage clients)
CREATE POLICY "Authenticated users can view clientes"
ON public.clientes FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert clientes"
ON public.clientes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update clientes"
ON public.clientes FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete clientes"
ON public.clientes FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Add trigger for updated_at on profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update other tables to use proper authentication checks
DROP POLICY IF EXISTS "Authenticated users can delete agendamentos" ON public.agendamentos;
DROP POLICY IF EXISTS "Authenticated users can insert agendamentos" ON public.agendamentos;
DROP POLICY IF EXISTS "Authenticated users can update agendamentos" ON public.agendamentos;
DROP POLICY IF EXISTS "Authenticated users can view agendamentos" ON public.agendamentos;

CREATE POLICY "Authenticated users can view agendamentos"
ON public.agendamentos FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert agendamentos"
ON public.agendamentos FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update agendamentos"
ON public.agendamentos FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete agendamentos"
ON public.agendamentos FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Update servicos policies
DROP POLICY IF EXISTS "Authenticated users can delete servicos" ON public.servicos;
DROP POLICY IF EXISTS "Authenticated users can insert servicos" ON public.servicos;
DROP POLICY IF EXISTS "Authenticated users can update servicos" ON public.servicos;
DROP POLICY IF EXISTS "Authenticated users can view servicos" ON public.servicos;

CREATE POLICY "Authenticated users can view servicos"
ON public.servicos FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert servicos"
ON public.servicos FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update servicos"
ON public.servicos FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete servicos"
ON public.servicos FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL);