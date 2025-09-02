-- Corrigir as políticas RLS problemáticas no agendamentos
-- Remover as políticas conflitantes que permitem acesso público

-- Primeiro, remover as políticas problemáticas
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.agendamentos;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.agendamentos;

-- As políticas restantes já são seguras e requerem autenticação:
-- "Authenticated users can view agendamentos"
-- "Authenticated users can insert agendamentos" 
-- "Authenticated users can update agendamentos"
-- "Authenticated users can delete agendamentos"
-- "Allow n8n webhook to insert agendamentos" (já existe)