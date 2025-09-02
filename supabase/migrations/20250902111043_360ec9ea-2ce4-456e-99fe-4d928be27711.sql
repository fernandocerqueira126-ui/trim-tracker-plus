-- Corrigir as políticas RLS problemáticas no agendamentos
-- Remover as políticas conflitantes que permitem acesso público

-- Primeiro, remover as políticas problemáticas
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.agendamentos;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.agendamentos;

-- Garantir que apenas as políticas corretas existam
-- As políticas restantes já são seguras e requerem autenticação:
-- "Authenticated users can view agendamentos"
-- "Authenticated users can insert agendamentos" 
-- "Authenticated users can update agendamentos"
-- "Authenticated users can delete agendamentos"

-- Também vamos criar uma política específica para o webhook n8n
-- que precisa inserir dados sem autenticação
CREATE POLICY "Allow n8n webhook to insert agendamentos" 
ON public.agendamentos 
FOR INSERT 
WITH CHECK (origem_agendamento = 'whatsapp');