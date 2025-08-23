-- Fix security issue: Restrict agendamentos table access to authenticated users only
-- Remove the overly permissive policy that allows public access
DROP POLICY IF EXISTS "Allow all operations on agendamentos" ON public.agendamentos;

-- Create secure policies for authenticated staff only
CREATE POLICY "Authenticated users can view agendamentos" 
ON public.agendamentos 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert agendamentos" 
ON public.agendamentos 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update agendamentos" 
ON public.agendamentos 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete agendamentos" 
ON public.agendamentos 
FOR DELETE 
TO authenticated
USING (true);

-- Also secure the other tables to follow the same pattern
-- Fix clientes table
DROP POLICY IF EXISTS "Allow all operations on clientes" ON public.clientes;

CREATE POLICY "Authenticated users can view clientes" 
ON public.clientes 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert clientes" 
ON public.clientes 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update clientes" 
ON public.clientes 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete clientes" 
ON public.clientes 
FOR DELETE 
TO authenticated
USING (true);

-- Fix servicos table
DROP POLICY IF EXISTS "Allow all operations on servicos" ON public.servicos;

CREATE POLICY "Authenticated users can view servicos" 
ON public.servicos 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert servicos" 
ON public.servicos 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update servicos" 
ON public.servicos 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete servicos" 
ON public.servicos 
FOR DELETE 
TO authenticated
USING (true);

-- Fix webhook_logs table  
DROP POLICY IF EXISTS "Allow all operations on webhook_logs" ON public.webhook_logs;

CREATE POLICY "Authenticated users can view webhook_logs" 
ON public.webhook_logs 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert webhook_logs" 
ON public.webhook_logs 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update webhook_logs" 
ON public.webhook_logs 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete webhook_logs" 
ON public.webhook_logs 
FOR DELETE 
TO authenticated
USING (true);