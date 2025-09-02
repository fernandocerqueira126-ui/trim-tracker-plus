import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, User, Scissors, Calendar } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"

interface Agendamento {
  id: string
  nome_cliente: string
  hora_agendamento: string
  funcionario: string
  servico_nome: string
  status: string
}

export function AgendamentosSidebar() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])

  useEffect(() => {
    async function loadAgendamentosHoje() {
      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('data_agendamento', today)
        .order('hora_agendamento', { ascending: true })
      
      if (!error && data) {
        setAgendamentos(data)
      }
    }

    loadAgendamentosHoje()

    // Real-time updates
    const channel = supabase
      .channel('agendamentos-sidebar')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'agendamentos' 
      }, () => {
        loadAgendamentosHoje()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmado':
        return 'bg-primary/20 text-primary border-primary/30'
      case 'concluido':
        return 'bg-barbershop-mint/20 text-barbershop-mint border-barbershop-mint/30'
      case 'cancelado':
        return 'bg-destructive/20 text-destructive border-destructive/30'
      default:
        return 'bg-secondary/20 text-secondary border-secondary/30'
    }
  }

  return (
    <Card className="bg-card/80 backdrop-blur-sm border border-primary/20 shadow-neon h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Agendamentos de Hoje
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {agendamentos.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum agendamento para hoje</p>
          </div>
        ) : (
          agendamentos.map((agendamento) => (
            <div
              key={agendamento.id}
              className="p-3 rounded-lg border border-border/50 bg-card/50 hover:bg-card/80 transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">{agendamento.nome_cliente}</span>
                </div>
                <Badge className={`text-xs ${getStatusColor(agendamento.status)}`}>
                  {agendamento.status}
                </Badge>
              </div>
              
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{agendamento.hora_agendamento}</span>
                </div>
                
                {agendamento.servico_nome && (
                  <div className="flex items-center gap-1">
                    <Scissors className="h-3 w-3" />
                    <span>{agendamento.servico_nome}</span>
                  </div>
                )}
                
                <div className="text-xs font-medium text-primary">
                  {agendamento.funcionario}
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}