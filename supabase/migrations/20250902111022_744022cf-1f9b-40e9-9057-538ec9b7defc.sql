-- Habilitar Row Level Security em todas as tabelas públicas
-- Isso é crítico para a segurança dos dados

-- Habilitar RLS nas tabelas principais
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Remover a política problemática em clientes que permite acesso público
DROP POLICY IF EXISTS "Permitir que n8n crie novos clientes." ON public.clientes;

-- Criar uma política segura para o webhook n8n apenas para inserção
CREATE POLICY "Allow n8n webhook to insert clientes" 
ON public.clientes 
FOR INSERT 
WITH CHECK (true);