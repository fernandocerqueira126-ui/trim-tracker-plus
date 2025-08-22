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
import { Plus, Edit, Trash2 } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

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
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingAgendamento, setEditingAgendamento] = useState<Agendamento | null>(null)
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
      const [agendamentosResult, clientesResult, servicosResult] = await Promise.all([
        supabase
          .from('agendamentos')
          .select(`
            *,
            clientes(nome),
            servicos(nome, preco)
          `)
          .order('data_agendamento', { ascending: false }),
        supabase.from('clientes').select('id, nome').order('nome'),
        supabase.from('servicos').select('id, nome, preco').order('nome')
      ])

      if (agendamentosResult.error) throw agendamentosResult.error
      if (clientesResult.error) throw clientesResult.error
      if (servicosResult.error) throw servicosResult.error

      setAgendamentos(agendamentosResult.data as Agendamento[] || [])
      setClientes(clientesResult.data || [])
      setServicos(servicosResult.data || [])
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

  function openAddDialog() {
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
    setOpen(true)
  }

  function getStatusBadge(status: string) {
    const variants = {
      agendado: 'default',
      concluido: 'secondary',
      cancelado: 'destructive'
    }
    return <Badge variant={variants[status as keyof typeof variants] as any}>{status}</Badge>
  }

  if (loading) {
    return <div className="text-center">Carregando...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Agendamentos</h1>
          <p className="text-muted-foreground">Gerencie os agendamentos da barbearia</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Agendamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingAgendamento ? 'Editar Agendamento' : 'Novo Agendamento'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="cliente_id">Cliente</Label>
                <Select value={formData.cliente_id} onValueChange={(value) => setFormData({ ...formData, cliente_id: value })}>
                  <SelectTrigger>
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
                  <SelectTrigger>
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
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="data_agendamento">Data</Label>
                  <Input
                    id="data_agendamento"
                    type="date"
                    value={formData.data_agendamento}
                    onChange={(e) => setFormData({ ...formData, data_agendamento: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="hora_agendamento">Hora</Label>
                  <Input
                    id="hora_agendamento"
                    type="time"
                    value={formData.hora_agendamento}
                    onChange={(e) => setFormData({ ...formData, hora_agendamento: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
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
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingAgendamento ? 'Atualizar' : 'Criar'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
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
                  <TableCell>{agendamento.funcionario}</TableCell>
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
    </div>
  )
}