import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Edit, Trash2 } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface Servico {
  id: string
  nome: string
  preco: number
  tempo_duracao: number
}

export default function Servicos() {
  const [servicos, setServicos] = useState<Servico[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingServico, setEditingServico] = useState<Servico | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    preco: '',
    tempo_duracao: ''
  })
  const { toast } = useToast()

  useEffect(() => {
    loadServicos()
  }, [])

  async function loadServicos() {
    try {
      const { data, error } = await supabase
        .from('servicos')
        .select('*')
        .order('nome')

      if (error) throw error
      setServicos(data || [])
    } catch (error) {
      console.error('Erro ao carregar serviços:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar serviços",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    try {
      const payload = {
        nome: formData.nome,
        preco: parseFloat(formData.preco),
        tempo_duracao: parseInt(formData.tempo_duracao)
      }

      if (editingServico) {
        const { error } = await supabase
          .from('servicos')
          .update(payload)
          .eq('id', editingServico.id)

        if (error) throw error
        toast({ title: "Sucesso", description: "Serviço atualizado com sucesso!" })
      } else {
        const { error } = await supabase
          .from('servicos')
          .insert([payload])

        if (error) throw error
        toast({ title: "Sucesso", description: "Serviço adicionado com sucesso!" })
      }

      setOpen(false)
      setEditingServico(null)
      setFormData({ nome: '', preco: '', tempo_duracao: '' })
      loadServicos()
    } catch (error) {
      console.error('Erro ao salvar serviço:', error)
      toast({
        title: "Erro",
        description: "Erro ao salvar serviço",
        variant: "destructive"
      })
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este serviço?')) return

    try {
      const { error } = await supabase
        .from('servicos')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast({ title: "Sucesso", description: "Serviço excluído com sucesso!" })
      loadServicos()
    } catch (error) {
      console.error('Erro ao excluir serviço:', error)
      toast({
        title: "Erro",
        description: "Erro ao excluir serviço",
        variant: "destructive"
      })
    }
  }

  function openEditDialog(servico: Servico) {
    setEditingServico(servico)
    setFormData({
      nome: servico.nome,
      preco: servico.preco.toString(),
      tempo_duracao: servico.tempo_duracao.toString()
    })
    setOpen(true)
  }

  function openAddDialog() {
    setEditingServico(null)
    setFormData({ nome: '', preco: '', tempo_duracao: '' })
    setOpen(true)
  }

  if (loading) {
    return <div className="text-center">Carregando...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Serviços</h1>
          <p className="text-muted-foreground">Gerencie os serviços oferecidos</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Serviço
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingServico ? 'Editar Serviço' : 'Adicionar Serviço'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome do Serviço</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="preco">Preço (R$)</Label>
                <Input
                  id="preco"
                  type="number"
                  step="0.01"
                  value={formData.preco}
                  onChange={(e) => setFormData({ ...formData, preco: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="tempo_duracao">Duração (minutos)</Label>
                <Input
                  id="tempo_duracao"
                  type="number"
                  value={formData.tempo_duracao}
                  onChange={(e) => setFormData({ ...formData, tempo_duracao: e.target.value })}
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingServico ? 'Atualizar' : 'Adicionar'}
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
          <CardTitle>Lista de Serviços</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {servicos.map((servico) => (
                <TableRow key={servico.id}>
                  <TableCell>{servico.nome}</TableCell>
                  <TableCell>R$ {servico.preco.toFixed(2)}</TableCell>
                  <TableCell>{servico.tempo_duracao} min</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(servico)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(servico.id)}
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