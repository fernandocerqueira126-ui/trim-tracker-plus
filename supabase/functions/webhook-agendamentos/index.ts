import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { 
      nome_cliente,
      telefone_cliente,
      data_agendamento,
      hora_agendamento,
      funcionario,
      servico_nome,
      status = 'agendado',
      observacoes,
      preco_servico
    } = await req.json()

    console.log('Dados recebidos do webhook:', {
      nome_cliente,
      telefone_cliente,
      data_agendamento,
      hora_agendamento,
      funcionario,
      servico_nome,
      status,
      observacoes,
      preco_servico
    })

    // Validar campos obrigatórios
    if (!nome_cliente || !telefone_cliente || !data_agendamento || !hora_agendamento || !funcionario || !servico_nome) {
      return new Response(
        JSON.stringify({ 
          error: 'Campos obrigatórios: nome_cliente, telefone_cliente, data_agendamento, hora_agendamento, funcionario, servico_nome' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Buscar ou criar cliente
    let cliente_id: string

    const { data: clienteExistente } = await supabase
      .from('clientes')
      .select('id')
      .eq('telefone', telefone_cliente)
      .maybeSingle()

    if (clienteExistente) {
      cliente_id = clienteExistente.id
      
      // Atualizar nome se necessário
      await supabase
        .from('clientes')
        .update({ 
          nome: nome_cliente,
          updated_at: new Date().toISOString()
        })
        .eq('id', cliente_id)
    } else {
      // Criar novo cliente
      const { data: novoCliente, error: clienteError } = await supabase
        .from('clientes')
        .insert({
          nome: nome_cliente,
          telefone: telefone_cliente
        })
        .select('id')
        .single()

      if (clienteError) {
        console.error('Erro ao criar cliente:', clienteError)
        throw clienteError
      }

      cliente_id = novoCliente.id
    }

    // Buscar serviço pelo nome
    const { data: servico } = await supabase
      .from('servicos')
      .select('id')
      .eq('nome', servico_nome)
      .maybeSingle()

    if (!servico) {
      return new Response(
        JSON.stringify({ 
          error: `Serviço '${servico_nome}' não encontrado. Cadastre o serviço primeiro.` 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Criar agendamento
    const { data: agendamento, error: agendamentoError } = await supabase
      .from('agendamentos')
      .insert({
        cliente_id,
        nome_cliente,
        telefone_cliente,
        data_agendamento,
        hora_agendamento,
        funcionario,
        servico_id: servico.id,
        status,
        observacoes,
        origem_agendamento: 'whatsapp',
        webhook_processado: true,
        dados_webhook: {
          nome_cliente,
          telefone_cliente,
          data_agendamento,
          hora_agendamento,
          funcionario,
          servico_nome,
          status,
          observacoes,
          preco_servico,
          timestamp: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (agendamentoError) {
      console.error('Erro ao criar agendamento:', agendamentoError)
      throw agendamentoError
    }

    // Log do webhook
    await supabase
      .from('webhook_logs')
      .insert({
        origem: 'n8n_google_sheets',
        agendamento_id: agendamento.id,
        dados_recebidos: {
          nome_cliente,
          telefone_cliente,
          data_agendamento,
          hora_agendamento,
          funcionario,
          servico_nome,
          status,
          observacoes,
          preco_servico
        },
        status_processamento: 'processado'
      })

    console.log('Agendamento criado com sucesso:', agendamento.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        agendamento_id: agendamento.id,
        cliente_id,
        message: 'Agendamento criado com sucesso' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Erro no webhook:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})