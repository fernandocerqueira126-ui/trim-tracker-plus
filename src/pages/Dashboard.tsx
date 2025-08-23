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
    <div className="space-y-8">
      <div className="flex flex-col gap-3">
        <h1 className="text-4xl font-bold bg-gradient-luxury bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-muted-foreground text-lg">
          Resumo das atividades da barbearia
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card/60 backdrop-blur-sm border-0 shadow-elegant hover:shadow-luxury transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <div className="w-10 h-10 bg-barbershop-blue/20 rounded-full flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats.totalClientes}</div>
            <p className="text-xs text-barbershop-mint font-medium">
              Clientes cadastrados
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur-sm border-0 shadow-elegant hover:shadow-luxury transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">Agendamentos Hoje</CardTitle>
            <div className="w-10 h-10 bg-barbershop-mint/20 rounded-full flex items-center justify-center">
              <Calendar className="h-5 w-5 text-secondary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-secondary">{stats.agendamentosHoje}</div>
            <p className="text-xs text-barbershop-mint font-medium">
              Para hoje
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur-sm border-0 shadow-elegant hover:shadow-luxury transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">Serviços Realizados</CardTitle>
            <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
              <Scissors className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats.servicosRealizados}</div>
            <p className="text-xs text-barbershop-mint font-medium">
              Total concluídos
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur-sm border-0 shadow-elegant hover:shadow-luxury transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">Receita do Mês</CardTitle>
            <div className="w-10 h-10 bg-barbershop-gold/20 rounded-full flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-accent" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">R$ {stats.receitaMes.toFixed(2)}</div>
            <p className="text-xs text-barbershop-mint font-medium">
              Aproximada
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}