import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Calendar, Scissors, DollarSign, Activity, TrendingUp, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { LiveClock } from "@/components/ui/live-clock"
import { LineChart, Line, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts"
import { WeeklyMetrics } from "@/components/dashboard/WeeklyMetrics"

interface DashboardStats {
  totalClientes: number
  agendamentosHoje: number
  agendamentosConfirmados: number
  agendamentosPendentes: number
  servicosRealizados: number
  receitaMes: number
  mediaDuracaoServicos: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalClientes: 0,
    agendamentosHoje: 0,
    agendamentosConfirmados: 0,
    agendamentosPendentes: 0,
    servicosRealizados: 0,
    receitaMes: 0,
    mediaDuracaoServicos: 0
  })

  // Mock data para gráfico de performance
  const chartData = [
    { name: 'Jan', value: 65 },
    { name: 'Fev', value: 78 },
    { name: 'Mar', value: 82 },
    { name: 'Abr', value: 91 },
    { name: 'Mai', value: 87 },
    { name: 'Jun', value: 94 }
  ]

  useEffect(() => {
    async function loadStats() {
      try {
        console.log('Carregando estatísticas...')
        
        // Total clientes
        const { count: clientesCount, error: clientesError } = await supabase
          .from('clientes')
          .select('*', { count: 'exact', head: true })
        
        if (clientesError) {
          console.error('Erro ao buscar clientes:', clientesError)
        } else {
          console.log('Total de clientes:', clientesCount)
        }

        // Agendamentos hoje
        const today = new Date().toISOString().split('T')[0]
        console.log('Data de hoje:', today)
        
        const { count: agendamentosCount, error: agendamentosError } = await supabase
          .from('agendamentos')
          .select('*', { count: 'exact', head: true })
          .eq('data_agendamento', today)
        
        // Agendamentos confirmados hoje
        const { count: confirmadosCount } = await supabase
          .from('agendamentos')
          .select('*', { count: 'exact', head: true })
          .eq('data_agendamento', today)
          .eq('status', 'confirmado')
        
        // Agendamentos pendentes hoje
        const { count: pendentesCount } = await supabase
          .from('agendamentos')
          .select('*', { count: 'exact', head: true })
          .eq('data_agendamento', today)
          .eq('status', 'agendado')
        
        if (agendamentosError) {
          console.error('Erro ao buscar agendamentos hoje:', agendamentosError)
        } else {
          console.log('Agendamentos hoje:', agendamentosCount)
        }

        // Debug: buscar todos os agendamentos para verificar
        const { data: todosAgendamentos, error: debugError } = await supabase
          .from('agendamentos')
          .select('data_agendamento, status, nome_cliente')
          .order('data_agendamento', { ascending: false })
          .limit(5)
        
        if (!debugError) {
          console.log('Últimos 5 agendamentos:', todosAgendamentos)
        }

        // Serviços realizados (status concluído)
        const { count: servicosCount, error: servicosError } = await supabase
          .from('agendamentos')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'concluido')
        
        if (servicosError) {
          console.error('Erro ao buscar serviços realizados:', servicosError)
        } else {
          console.log('Serviços realizados:', servicosCount)
        }

        // Receita do mês (aproximada) - corrigindo consulta
        const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
        const { data: agendamentosMes, error: receitaError } = await supabase
          .from('agendamentos')
          .select('servico_id')
          .eq('status', 'concluido')
          .gte('data_agendamento', firstDayOfMonth)

        console.log('Agendamentos do mês (concluídos):', agendamentosMes?.length || 0)

        // Buscar preços dos serviços separadamente
        let receita = 0
        if (agendamentosMes && agendamentosMes.length > 0) {
          const servicoIds = agendamentosMes
            .map(a => a.servico_id)
            .filter(id => id !== null)
          
          if (servicoIds.length > 0) {
            const { data: servicos } = await supabase
              .from('servicos')
              .select('id, preco, tempo_duracao')
              .in('id', servicoIds)

            receita = agendamentosMes.reduce((total, agendamento) => {
              const servico = servicos?.find(s => s.id === agendamento.servico_id)
              return total + (servico?.preco || 0)
            }, 0)
          }
        }

        // Calcular média de duração dos serviços
        const { data: servicosAtivos } = await supabase
          .from('servicos')
          .select('tempo_duracao')
        
        const mediaDuracao = servicosAtivos?.length > 0 
          ? servicosAtivos.reduce((acc, s) => acc + s.tempo_duracao, 0) / servicosAtivos.length
          : 0

        const newStats = {
          totalClientes: clientesCount || 0,
          agendamentosHoje: agendamentosCount || 0,
          agendamentosConfirmados: confirmadosCount || 0,
          agendamentosPendentes: pendentesCount || 0,
          servicosRealizados: servicosCount || 0,
          receitaMes: Number(receita) || 0,
          mediaDuracaoServicos: Math.round(mediaDuracao) || 0
        }
        
        console.log('Estatísticas finais:', newStats)
        setStats(newStats)
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error)
      }
    }

    loadStats()

    // Configurar real-time updates
    const channels = [
      supabase
        .channel('clientes-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' }, () => {
          loadStats()
        })
        .subscribe(),
      
      supabase
        .channel('agendamentos-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'agendamentos' }, () => {
          loadStats()
        })
        .subscribe(),

      supabase
        .channel('servicos-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'servicos' }, () => {
          loadStats()
        })
        .subscribe()
    ]

    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel)
      })
    }
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
            <CardTitle className="text-sm font-medium text-foreground">Confirmados Hoje</CardTitle>
            <div className="w-12 h-12 bg-barbershop-mint/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform border border-barbershop-mint/30">
              <CheckCircle className="h-6 w-6 text-barbershop-mint" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-barbershop-mint mb-1 font-mono">{stats.agendamentosConfirmados}</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-barbershop-mint rounded-full animate-pulse"></div>
              <p className="text-xs text-barbershop-mint font-medium">
                Confirmados
              </p>
            </div>
            <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-barbershop-mint transition-all duration-1000"
                style={{ width: `${Math.min(100, (stats.agendamentosConfirmados / 20) * 100)}%` }}
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
            <CardTitle className="text-sm font-medium text-foreground">Tempo Médio</CardTitle>
            <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform border border-accent/30">
              <Clock className="h-6 w-6 text-accent" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent mb-1 font-mono">{stats.mediaDuracaoServicos}min</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
              <p className="text-xs text-accent font-medium">
                Por serviço
              </p>
            </div>
            <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-accent transition-all duration-1000"
                style={{ width: `${Math.min(100, (stats.mediaDuracaoServicos / 120) * 100)}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cards extras */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-card/80 backdrop-blur-sm border border-secondary/20 shadow-neon hover:shadow-luxury transition-all duration-300 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-foreground">Pendentes Hoje</CardTitle>
            <div className="w-12 h-12 bg-secondary/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform border border-secondary/30">
              <AlertCircle className="h-6 w-6 text-secondary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-secondary mb-1 font-mono">{stats.agendamentosPendentes}</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-secondary rounded-full animate-pulse"></div>
              <p className="text-xs text-secondary font-medium">
                Aguardando
              </p>
            </div>
            <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-secondary transition-all duration-1000"
                style={{ width: `${Math.min(100, (stats.agendamentosPendentes / 20) * 100)}%` }}
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

        <Card className="bg-card/80 backdrop-blur-sm border border-primary/20 shadow-neon hover:shadow-luxury transition-all duration-300 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-foreground">Total Hoje</CardTitle>
            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform border border-primary/30">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary mb-1 font-mono">{stats.agendamentosHoje}</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <p className="text-xs text-primary font-medium">
                Agendamentos
              </p>
            </div>
            <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-1000"
                style={{ width: `${Math.min(100, (stats.agendamentosHoje / 20) * 100)}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seção de gráficos expandida */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Gráfico semanal */}
        <WeeklyMetrics />

        {/* Gráfico de Status dos Agendamentos */}
        <Card className="bg-card/80 backdrop-blur-sm border border-primary/20 shadow-neon">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Status dos Agendamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Confirmados', value: stats.agendamentosConfirmados, fill: 'hsl(var(--barbershop-mint))' },
                      { name: 'Pendentes', value: stats.agendamentosPendentes, fill: 'hsl(var(--secondary))' },
                      { name: 'Concluídos', value: stats.servicosRealizados, fill: 'hsl(var(--primary))' }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius)',
                      color: 'hsl(var(--card-foreground))'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Legenda personalizada */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--barbershop-mint))' }}></div>
                <span className="text-sm">Confirmados: {stats.agendamentosConfirmados}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--secondary))' }}></div>
                <span className="text-sm">Pendentes: {stats.agendamentosPendentes}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--primary))' }}></div>
                <span className="text-sm">Concluídos: {stats.servicosRealizados}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Distribuição por Funcionário */}
        <Card className="bg-card/80 backdrop-blur-sm border border-primary/20 shadow-neon">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Atendimentos por Funcionário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Funcionário 1', value: Math.floor(stats.servicosRealizados * 0.6), fill: 'hsl(var(--primary))' },
                      { name: 'Funcionário 2', value: Math.floor(stats.servicosRealizados * 0.4), fill: 'hsl(var(--accent))' }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius)',
                      color: 'hsl(var(--card-foreground))'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Legenda */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--primary))' }}></div>
                <span className="text-sm">Funcionário 1: {Math.floor(stats.servicosRealizados * 0.6)}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--accent))' }}></div>
                <span className="text-sm">Funcionário 2: {Math.floor(stats.servicosRealizados * 0.4)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos de performance e status */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Gráfico de Performance */}
        <Card className="bg-card/80 backdrop-blur-sm border border-primary/20 shadow-neon">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Performance Mensal
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
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
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
                <span className="text-xs bg-barbershop-mint/20 text-barbershop-mint px-2 py-1 rounded-full">Active</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Backup</span>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-barbershop-mint/20 text-barbershop-mint px-2 py-1 rounded-full">Active</span>
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