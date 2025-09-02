import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { Scissors } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"

interface ServiceData {
  name: string
  value: number
  color: string
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--barbershop-mint))',
  'hsl(var(--accent))',
  'hsl(var(--secondary))',
  'hsl(var(--barbershop-gold))'
]

export function ServicesChart() {
  const [servicesData, setServicesData] = useState<ServiceData[]>([])

  useEffect(() => {
    async function loadServicesData() {
      // Buscar agendamentos dos últimos 30 dias
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const dateStr = thirtyDaysAgo.toISOString().split('T')[0]

      const { data: agendamentos } = await supabase
        .from('agendamentos')
        .select('servico_nome')
        .eq('status', 'concluido')
        .gte('data_agendamento', dateStr)

      if (agendamentos) {
        // Contar serviços
        const serviceCounts = agendamentos.reduce((acc, agendamento) => {
          const serviceName = agendamento.servico_nome || 'Serviço não especificado'
          acc[serviceName] = (acc[serviceName] || 0) + 1
          return acc
        }, {} as Record<string, number>)

        // Converter para formato do gráfico
        const chartData = Object.entries(serviceCounts)
          .map(([name, value], index) => ({
            name,
            value,
            color: COLORS[index % COLORS.length]
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5) // Top 5 serviços

        setServicesData(chartData)
      }
    }

    loadServicesData()

    // Real-time updates
    const channel = supabase
      .channel('services-chart')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'agendamentos' 
      }, () => {
        loadServicesData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <Card className="bg-card/80 backdrop-blur-sm border border-primary/20 shadow-neon">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Scissors className="h-5 w-5 text-primary" />
          Serviços Mais Realizados
          <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
            30 dias
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {servicesData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Scissors className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum serviço concluído</p>
            </div>
          </div>
        ) : (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={servicesData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {servicesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                    color: 'hsl(var(--card-foreground))'
                  }}
                />
                <Legend 
                  wrapperStyle={{
                    fontSize: '12px',
                    color: 'hsl(var(--muted-foreground))'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}