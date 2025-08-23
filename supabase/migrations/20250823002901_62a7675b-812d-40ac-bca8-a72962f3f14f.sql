-- Primeiro, vamos verificar se precisamos adicionar campos à tabela existente de agendamentos
-- ou se ela já atende às necessidades. Vamos adicionar campos específicos para integração WhatsApp/n8n

-- Adicionar campos para melhor integração com WhatsApp e n8n
ALTER TABLE public.agendamentos 
ADD COLUMN IF NOT EXISTS origem_agendamento TEXT DEFAULT 'whatsapp',
ADD COLUMN IF NOT EXISTS telefone_cliente TEXT,
ADD COLUMN IF NOT EXISTS nome_cliente TEXT,
ADD COLUMN IF NOT EXISTS webhook_processado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS dados_webhook JSONB;

-- Criar índices para melhor performance nas consultas
CREATE INDEX IF NOT EXISTS idx_agendamentos_data ON public.agendamentos(data_agendamento);
CREATE INDEX IF NOT EXISTS idx_agendamentos_status ON public.agendamentos(status);
CREATE INDEX IF NOT EXISTS idx_agendamentos_origem ON public.agendamentos(origem_agendamento);
CREATE INDEX IF NOT EXISTS idx_agendamentos_telefone ON public.agendamentos(telefone_cliente);
CREATE INDEX IF NOT EXISTS idx_agendamentos_webhook ON public.agendamentos(webhook_processado);

-- Criar uma tabela adicional para logs de webhook/n8n se necessário
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agendamento_id UUID REFERENCES public.agendamentos(id),
  origem TEXT NOT NULL DEFAULT 'n8n',
  dados_recebidos JSONB,
  status_processamento TEXT DEFAULT 'processado',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS para webhook_logs
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Criar política para webhook_logs
CREATE POLICY "Allow all operations on webhook_logs" 
ON public.webhook_logs 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Trigger para atualizar updated_at em webhook_logs
CREATE TRIGGER update_webhook_logs_updated_at
BEFORE UPDATE ON public.webhook_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar realtime para as tabelas
ALTER PUBLICATION supabase_realtime ADD TABLE public.agendamentos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.webhook_logs;