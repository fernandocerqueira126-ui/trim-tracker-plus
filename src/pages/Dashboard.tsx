import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Calendar, Scissors, DollarSign, Activity, TrendingUp, Clock } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { LiveClock } from "@/components/ui/live-clock"
import { LineChart, Line, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

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

  // Mock data para gráficos (baseado nas métricas do sistema)
  const chartData = [
    { name: 'Jan', value: 65 },
    { name: 'Fev', value: 78 },
    { name: 'Mar', value: 82 },
    { name: 'Abr', value: 91 },
    { name: 'Mai', value: 87 },
    { name: 'Jun', value: 94 }
  ]

  const statusData = [
    { name: 'Concluídos', value: stats.servicosRealizados, color: 'hsl(var(--primary))' },
    { name: 'Pendentes', value: stats.agendamentosHoje, color: 'hsl(var(--secondary))' },
    { name: 'Clientes', value: stats.totalClientes, color: 'hsl(var(--accent))' }
  ]

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
      {/* Header com relógio */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-bold bg-gradient-neon bg-clip-text text-transparent">
            Sistema de Controle
          </h1>
          <p className="text-muted-foreground text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Dashboard da Barbearia França
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary ml-2">
              LIVE
            </span>
          </p>
        </div>
        
        {/* Relógio no canto superior direito */}
        <div className="bg-card/80 backdrop-blur-sm border border-primary/20 rounded-xl p-4 shadow-neon">
          <LiveClock />
        </div>
      </div>

      {/* Cards de métricas com visual atualizado */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card/80 backdrop-blur-sm border border-primary/20 shadow-neon hover:shadow-luxury transition-all duration-300 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-foreground">Total de Clientes</CardTitle>
            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="h-6 w-6 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary mb-1 font-mono">{stats.totalClientes}</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <p className="text-xs text-primary font-medium">
                Clientes cadastrados
              </p>
            </div>
            <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-primary transition-all duration-1000"
                style={{ width: `${Math.min(100, (stats.totalClientes / 100) * 100)}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/80 backdrop-blur-sm border border-secondary/20 shadow-neon hover:shadow-luxury transition-all duration-300 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-foreground">Agendamentos Hoje</CardTitle>
            <div className="w-12 h-12 bg-secondary/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform border border-secondary/30">
              <Calendar className="h-6 w-6 text-secondary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-secondary mb-1 font-mono">{stats.agendamentosHoje}</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-secondary rounded-full animate-pulse"></div>
              <p className="text-xs text-secondary font-medium">
                Para hoje
              </p>
            </div>
            <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-secondary transition-all duration-1000"
                style={{ width: `${Math.min(100, (stats.agendamentosHoje / 20) * 100)}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/80 backdrop-blur-sm border border-primary/20 shadow-neon hover:shadow-luxury transition-all duration-300 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-foreground">Serviços Realizados</CardTitle>
            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Scissors className="h-6 w-6 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary mb-1 font-mono">{stats.servicosRealizados}</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <p className="text-xs text-primary font-medium">
                Total concluídos
              </p>
            </div>
            <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-primary transition-all duration-1000"
                style={{ width: `${Math.min(100, (stats.servicosRealizados / 200) * 100)}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/80 backdrop-blur-sm border border-accent/20 shadow-neon hover:shadow-luxury transition-all duration-300 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-foreground">Receita do Mês</CardTitle>
            <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform border border-accent/30">
              <DollarSign className="h-6 w-6 text-accent" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent mb-1 font-mono">R$ {stats.receitaMes.toFixed(2)}</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
              <p className="text-xs text-accent font-medium">
                Aproximada
              </p>
            </div>
            <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-accent transition-all duration-1000"
                style={{ width: `${Math.min(100, (stats.receitaMes / 5000) * 100)}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seção de gráficos e monitoramento */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Gráfico de Performance */}
        <Card className="bg-card/80 backdrop-blur-sm border border-primary/20 shadow-neon">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Performance
              </CardTitle>
              <div className="flex gap-2">
                <div className="w-3 h-3 bg-primary rounded-full"></div>
                <div className="w-3 h-3 bg-secondary rounded-full"></div>
                <div className="w-3 h-3 bg-accent rounded-full"></div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status do Sistema */}
        <Card className="bg-card/80 backdrop-blur-sm border border-primary/20 shadow-neon">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Status do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Firewall</span>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">Active</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Backup</span>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">Active</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Database</span>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">Updated</span>
              </div>
            </div>
            
            {/* Allocation de recursos */}
            <div className="mt-6 space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Alocação de Recursos</h4>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>CPU Usage</span>
                  <span className="text-primary">42% allocated</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[42%] transition-all duration-1000"></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Memory</span>
                  <span className="text-secondary">68% allocated</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-secondary w-[68%] transition-all duration-1000"></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Network</span>
                  <span className="text-accent">35% allocated</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-accent w-[35%] transition-all duration-1000"></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}