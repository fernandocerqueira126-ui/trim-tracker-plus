import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { TrendingUp, Calendar } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"

interface WeeklyData {
  day: string
  agendamentos: number
  concluidos: number
}

export function WeeklyMetrics() {
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([])

  useEffect(() => {
    async function loadWeeklyData() {
      const today = new Date()
      const startOfWeek = new Date(today)
      startOfWeek.setDate(today.getDate() - today.getDay())

      const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
      const weeklyStats = []

      for (let i = 0; i < 7; i++) {
        const currentDay = new Date(startOfWeek)
        currentDay.setDate(startOfWeek.getDate() + i)
        const dateStr = currentDay.toISOString().split('T')[0]

        const { count: totalAgendamentos } = await supabase
          .from('agendamentos')
          .select('*', { count: 'exact', head: true })
          .eq('data_agendamento', dateStr)

        const { count: concluidos } = await supabase
          .from('agendamentos')
          .select('*', { count: 'exact', head: true })
          .eq('data_agendamento', dateStr)
          .eq('status', 'concluido')

        weeklyStats.push({
          day: weekDays[i],
          agendamentos: totalAgendamentos || 0,
          concluidos: concluidos || 0
        })
      }

      setWeeklyData(weeklyStats)
    }

    loadWeeklyData()

    // Real-time updates
    const channel = supabase
      .channel('weekly-metrics')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'agendamentos' 
      }, () => {
        loadWeeklyData()
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
          <Calendar className="h-5 w-5 text-primary" />
          Agendamentos Semanais
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData}>
              <XAxis 
                dataKey="day" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius)',
                  color: 'hsl(var(--card-foreground))'
                }}
              />
              <Bar 
                dataKey="agendamentos" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
                name="Total"
              />
              <Bar 
                dataKey="concluidos" 
                fill="hsl(var(--barbershop-mint))" 
                radius={[4, 4, 0, 0]}
                name="Concluídos"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}