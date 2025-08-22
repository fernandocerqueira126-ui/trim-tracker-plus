import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Calendar, Scissors, DollarSign } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"

interface DashboardStats {
  totalClientes: number
  agendamentosHoje: number
  servicosRealizados: number
  receitaMes: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalClientes: 0,
    agendamentosHoje: 0,
    servicosRealizados: 0,
    receitaMes: 0
  })

  useEffect(() => {
    async function loadStats() {
      try {
        // Total clientes
        const { count: clientesCount } = await supabase
          .from('clientes')
          .select('*', { count: 'exact', head: true })

        // Agendamentos hoje
        const today = new Date().toISOString().split('T')[0]
        const { count: agendamentosCount } = await supabase
          .from('agendamentos')
          .select('*', { count: 'exact', head: true })
          .eq('data_agendamento', today)

        // Serviços realizados (status concluído)
        const { count: servicosCount } = await supabase
          .from('agendamentos')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'concluido')

        // Receita do mês (aproximada)
        const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
        const { data: agendamentosMes } = await supabase
          .from('agendamentos')
          .select(`
            servicos!inner(preco)
          `)
          .eq('status', 'concluido')
          .gte('data_agendamento', firstDayOfMonth)

        const receita = agendamentosMes?.reduce((total, agendamento) => {
          return total + (agendamento.servicos?.preco || 0)
        }, 0) || 0

        setStats({
          totalClientes: clientesCount || 0,
          agendamentosHoje: agendamentosCount || 0,
          servicosRealizados: servicosCount || 0,
          receitaMes: receita
        })
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error)
      }
    }

    loadStats()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Resumo das atividades da barbearia</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClientes}</div>
            <p className="text-xs text-muted-foreground">
              Clientes cadastrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendamentos Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.agendamentosHoje}</div>
            <p className="text-xs text-muted-foreground">
              Para hoje
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Serviços Realizados</CardTitle>
            <Scissors className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.servicosRealizados}</div>
            <p className="text-xs text-muted-foreground">
              Total concluídos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita do Mês</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {stats.receitaMes.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Aproximada
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}