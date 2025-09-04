import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Plus, Edit, Trash2, Calendar as CalendarIcon, Clock, User } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface Agendamento {
  id: string
  cliente_id: string
  servico_id: string
  funcionario: string
  data_agendamento: string
  hora_agendamento: string
  status: 'agendado' | 'concluido' | 'cancelado'
  observacoes?: string
  clientes: { nome: string }
  servicos: { nome: string; preco: number }
  profiles?: { full_name: string | null }
}

interface Cliente {
  id: string
  nome: string
}

interface Servico {
  id: string
  nome: string
  preco: number
}

export default function Agendamentos() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [servicos, setServicos] = useState<Servico[]>([])
  const [funcionarios, setFuncionarios] = useState<{[key: string]: string}>({})
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingAgendamento, setEditingAgendamento] = useState<Agendamento | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')
  const [formData, setFormData] = useState({
    cliente_id: '',
    servico_id: '',
    funcionario: '',
    data_agendamento: '',
    hora_agendamento: '',
    status: 'agendado' as 'agendado' | 'concluido' | 'cancelado',
    observacoes: ''
  })
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [agendamentosResult, clientesResult, servicosResult, funcionariosResult] = await Promise.all([
        supabase
          .from('agendamentos')
          .select(`
            *,
            clientes(nome),
            servicos(nome, preco)
          `)
          .order('data_agendamento', { ascending: false }),
        supabase.from('clientes').select('id, nome').order('nome'),
        supabase.from('servicos').select('id, nome, preco').order('nome'),
        supabase.from('profiles').select('id, full_name').eq('role', 'employee')
      ])

      if (agendamentosResult.error) throw agendamentosResult.error
      if (clientesResult.error) throw clientesResult.error
      if (servicosResult.error) throw servicosResult.error
      if (funcionariosResult.error) throw funcionariosResult.error

      // Criar mapa de funcionários para lookup rápido
      const funcionariosMap: {[key: string]: string} = {}
      funcionariosResult.data?.forEach(funcionario => {
        funcionariosMap[funcionario.id] = funcionario.full_name || 'Funcionário Desconhecido'
      })

      setAgendamentos(agendamentosResult.data as Agendamento[] || [])
      setClientes(clientesResult.data || [])
      setServicos(servicosResult.data || [])
      setFuncionarios(funcionariosMap)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    try {
      if (editingAgendamento) {
        const { error } = await supabase
          .from('agendamentos')
          .update(formData)
          .eq('id', editingAgendamento.id)

        if (error) throw error
        toast({ title: "Sucesso", description: "Agendamento atualizado com sucesso!" })
      } else {
        const { error } = await supabase
          .from('agendamentos')
          .insert([formData])

        if (error) throw error
        toast({ title: "Sucesso", description: "Agendamento criado com sucesso!" })
      }

      setOpen(false)
      setEditingAgendamento(null)
      setFormData({
        cliente_id: '',
        servico_id: '',
        funcionario: '',
        data_agendamento: '',
        hora_agendamento: '',
        status: 'agendado',
        observacoes: ''
      })
      loadData()
    } catch (error) {
      console.error('Erro ao salvar agendamento:', error)
      toast({
        title: "Erro",
        description: "Erro ao salvar agendamento",
        variant: "destructive"
      })
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este agendamento?')) return

    try {
      const { error } = await supabase
        .from('agendamentos')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast({ title: "Sucesso", description: "Agendamento excluído com sucesso!" })
      loadData()
    } catch (error) {
      console.error('Erro ao excluir agendamento:', error)
      toast({
        title: "Erro",
        description: "Erro ao excluir agendamento",
        variant: "destructive"
      })
    }
  }

  function openEditDialog(agendamento: Agendamento) {
    setEditingAgendamento(agendamento)
    setFormData({
      cliente_id: agendamento.cliente_id,
      servico_id: agendamento.servico_id,
      funcionario: agendamento.funcionario,
      data_agendamento: agendamento.data_agendamento,
      hora_agendamento: agendamento.hora_agendamento,
      status: agendamento.status,
      observacoes: agendamento.observacoes || ''
    })
    setOpen(true)
  }

  function openAddDialog(date?: Date) {
    setEditingAgendamento(null)
    setFormData({
      cliente_id: '',
      servico_id: '',
      funcionario: '',
      data_agendamento: date ? format(date, 'yyyy-MM-dd') : '',
      hora_agendamento: '',
      status: 'agendado',
      observacoes: ''
    })
    setOpen(true)
  }

  function getStatusBadge(status: string) {
    const variants = {
      agendado: 'default',
      concluido: 'secondary',
      cancelado: 'destructive'
    }
    const colors = {
      agendado: 'bg-blue-500',
      concluido: 'bg-green-500', 
      cancelado: 'bg-red-500'
    }
    return (
      <Badge variant={variants[status as keyof typeof variants] as any} className="capitalize">
        <div className={`w-2 h-2 rounded-full mr-2 ${colors[status as keyof typeof colors]}`}></div>
        {status}
      </Badge>
    )
  }

  function getAgendamentosForDate(date: Date) {
    const dateStr = format(date, 'yyyy-MM-dd')
    return agendamentos.filter(ag => ag.data_agendamento === dateStr)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando agendamentos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <div className="p-6 space-y-8">
        {/* Header */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5 border border-primary/20 p-8">
          <div className="relative z-10 flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Agenda de Agendamentos
              </h1>
              <p className="text-muted-foreground/80 mt-2">
                Gerencie todos os agendamentos da barbearia
              </p>
            </div>

            <div className="flex gap-3">
              <div className="flex rounded-lg border border-primary/20 p-1 bg-card/50">
                <Button
                  variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('calendar')}
                  className={viewMode === 'calendar' ? 'bg-primary text-primary-foreground' : ''}
                >
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Calendário
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={viewMode === 'list' ? 'bg-primary text-primary-foreground' : ''}
                >
                  Lista
                </Button>
              </div>

              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button 
                    onClick={() => openAddDialog()}
                    className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 border-0 shadow-lg shadow-primary/20"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Agendamento
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                      {editingAgendamento ? 'Editar Agendamento' : 'Novo Agendamento'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="cliente_id">Cliente</Label>
                      <Select value={formData.cliente_id} onValueChange={(value) => setFormData({ ...formData, cliente_id: value })}>
                        <SelectTrigger className="border-primary/20 focus:border-primary/50">
                          <SelectValue placeholder="Selecione um cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          {clientes.map((cliente) => (
                            <SelectItem key={cliente.id} value={cliente.id}>
                              {cliente.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="servico_id">Serviço</Label>
                      <Select value={formData.servico_id} onValueChange={(value) => setFormData({ ...formData, servico_id: value })}>
                        <SelectTrigger className="border-primary/20 focus:border-primary/50">
                          <SelectValue placeholder="Selecione um serviço" />
                        </SelectTrigger>
                        <SelectContent>
                          {servicos.map((servico) => (
                            <SelectItem key={servico.id} value={servico.id}>
                              {servico.nome} - R$ {servico.preco.toFixed(2)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="funcionario">Funcionário</Label>
                      <Input
                        id="funcionario"
                        value={formData.funcionario}
                        onChange={(e) => setFormData({ ...formData, funcionario: e.target.value })}
                        className="border-primary/20 focus:border-primary/50"
                        placeholder="Nome do funcionário"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="data_agendamento">Data</Label>
                        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal border-primary/20",
                                !formData.data_agendamento && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {formData.data_agendamento ? (
                                format(new Date(formData.data_agendamento), "dd/MM/yyyy")
                              ) : (
                                <span>Selecionar data</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={formData.data_agendamento ? new Date(formData.data_agendamento) : undefined}
                              onSelect={(date) => {
                                if (date) {
                                  setFormData({ ...formData, data_agendamento: format(date, 'yyyy-MM-dd') })
                                  setCalendarOpen(false)
                                }
                              }}
                              initialFocus
                              className={cn("p-3 pointer-events-auto")}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div>
                        <Label htmlFor="hora_agendamento">Hora</Label>
                        <Input
                          id="hora_agendamento"
                          type="time"
                          value={formData.hora_agendamento}
                          onChange={(e) => setFormData({ ...formData, hora_agendamento: e.target.value })}
                          className="border-primary/20 focus:border-primary/50"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                        <SelectTrigger className="border-primary/20 focus:border-primary/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="agendado">Agendado</SelectItem>
                          <SelectItem value="concluido">Concluído</SelectItem>
                          <SelectItem value="cancelado">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="observacoes">Observações</Label>
                      <Textarea
                        id="observacoes"
                        value={formData.observacoes}
                        onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                        className="border-primary/20 focus:border-primary/50"
                        placeholder="Observações sobre o agendamento..."
                      />
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button type="submit" className="flex-1 bg-gradient-to-r from-primary to-primary/80">
                        {editingAgendamento ? 'Atualizar' : 'Criar'}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-primary/20">
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {viewMode === 'calendar' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Calendário */}
            <Card className="lg:col-span-2 border-primary/20 bg-gradient-to-br from-card to-card/80">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <CalendarIcon className="h-5 w-5 mr-2 text-primary" />
                  Calendário de Agendamentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  className={cn("w-full pointer-events-auto")}
                  locale={ptBR}
                  modifiers={{
                    hasAgendamentos: (date) => getAgendamentosForDate(date).length > 0
                  }}
                  modifiersStyles={{
                    hasAgendamentos: { 
                      backgroundColor: 'hsl(var(--primary))', 
                      color: 'white',
                      fontWeight: 'bold'
                    }
                  }}
                />
              </CardContent>
            </Card>

            {/* Agendamentos do dia selecionado */}
            <Card className="border-primary/20 bg-gradient-to-br from-card to-card/80">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                  <span className="flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-primary" />
                    {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                  </span>
                  <Button 
                    size="sm" 
                    onClick={() => openAddDialog(selectedDate)}
                    className="bg-primary/20 hover:bg-primary/30 text-primary border-primary/20"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {getAgendamentosForDate(selectedDate).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhum agendamento para este dia</p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => openAddDialog(selectedDate)}
                      className="mt-2 text-primary"
                    >
                      Criar agendamento
                    </Button>
                  </div>
                ) : (
                  getAgendamentosForDate(selectedDate)
                    .sort((a, b) => a.hora_agendamento.localeCompare(b.hora_agendamento))
                    .map((agendamento) => (
                      <Card key={agendamento.id} className="bg-primary/5 border-primary/20">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-semibold text-sm">{agendamento.hora_agendamento}</p>
                              <p className="text-sm text-muted-foreground flex items-center">
                                <User className="h-3 w-3 mr-1" />
                                {agendamento.clientes?.nome}
                              </p>
                            </div>
                            {getStatusBadge(agendamento.status)}
                          </div>
                          <p className="text-sm font-medium">{agendamento.servicos?.nome}</p>
                           <p className="text-xs text-muted-foreground">
                             Com {funcionarios[agendamento.funcionario] || agendamento.funcionario}
                           </p>
                          <div className="flex gap-1 mt-3">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openEditDialog(agendamento)}
                              className="h-8 text-xs flex-1"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(agendamento.id)}
                              className="h-8 text-xs text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="border-primary/20 bg-gradient-to-br from-card to-card/80">
            <CardHeader>
              <CardTitle>Lista de Agendamentos</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Hora</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agendamentos.map((agendamento) => (
                    <TableRow key={agendamento.id}>
                      <TableCell>{agendamento.clientes?.nome}</TableCell>
                      <TableCell>{agendamento.servicos?.nome}</TableCell>
                      <TableCell>{funcionarios[agendamento.funcionario] || agendamento.funcionario}</TableCell>
                      <TableCell>
                        {new Date(agendamento.data_agendamento).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>{agendamento.hora_agendamento}</TableCell>
                      <TableCell>{getStatusBadge(agendamento.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(agendamento)}
                            className="border-primary/20 hover:border-primary/40"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(agendamento.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}