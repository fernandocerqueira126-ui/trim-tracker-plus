-- Habilitar RLS para todas as tabelas que ainda não tem
DO $$
BEGIN
    -- Verificar e habilitar RLS para clientes se não estiver habilitado
    IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'clientes' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- Verificar e habilitar RLS para agendamentos se não estiver habilitado
    IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'agendamentos' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- Verificar e habilitar RLS para servicos se não estiver habilitado
    IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'servicos' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- Verificar e habilitar RLS para webhook_logs se não estiver habilitado
    IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'webhook_logs' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Configurar realtime para as tabelas
ALTER TABLE public.clientes REPLICA IDENTITY FULL;
ALTER TABLE public.agendamentos REPLICA IDENTITY FULL;
ALTER TABLE public.servicos REPLICA IDENTITY FULL;