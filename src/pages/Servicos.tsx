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
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <div className="p-6 space-y-8">
        {/* Header com gradiente */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5 border border-primary/20 p-8">
          <div className="relative z-10 flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Gerenciar Serviços
              </h1>
              <p className="text-muted-foreground/80 mt-2">
                Configure e organize todos os serviços da barbearia
              </p>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={openAddDialog}
                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 border-0 shadow-lg shadow-primary/20"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Serviço
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    {editingServico ? 'Editar Serviço' : 'Novo Serviço'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="nome" className="text-sm font-medium text-foreground/90">Nome do Serviço</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      className="mt-1 border-primary/20 focus:border-primary/50"
                      placeholder="Ex: Corte + Barba"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="preco" className="text-sm font-medium text-foreground/90">Preço (R$)</Label>
                    <Input
                      id="preco"
                      type="number"
                      step="0.01"
                      value={formData.preco}
                      onChange={(e) => setFormData({ ...formData, preco: e.target.value })}
                      className="mt-1 border-primary/20 focus:border-primary/50"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="tempo_duracao" className="text-sm font-medium text-foreground/90">Duração (minutos)</Label>
                    <Input
                      id="tempo_duracao"
                      type="number"
                      value={formData.tempo_duracao}
                      onChange={(e) => setFormData({ ...formData, tempo_duracao: e.target.value })}
                      className="mt-1 border-primary/20 focus:border-primary/50"
                      placeholder="Ex: 30"
                      required
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1 bg-gradient-to-r from-primary to-primary/80">
                      {editingServico ? 'Atualizar' : 'Adicionar'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-primary/20">
                      Cancelar
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Efeito de brilho */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-pulse" />
        </div>

        {/* Grid de Cards dos Serviços */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servicos.map((servico) => (
            <Card 
              key={servico.id} 
              className="group hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 border-primary/20 hover:border-primary/40 bg-gradient-to-br from-card to-card/80"
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {servico.nome}
                    </CardTitle>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span className="flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        {servico.tempo_duracao} min
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">
                      R$ {servico.preco.toFixed(2)}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(servico)}
                    className="flex-1 border-primary/20 hover:border-primary/40 hover:bg-primary/10"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(servico.id)}
                    className="flex-1 hover:bg-destructive/90"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {/* Card para adicionar novo serviço */}
          <Card 
            className="group hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 border-dashed border-2 border-primary/30 hover:border-primary/50 bg-gradient-to-br from-primary/5 to-transparent cursor-pointer"
            onClick={openAddDialog}
          >
            <CardContent className="flex flex-col items-center justify-center h-48 text-center">
              <Plus className="h-12 w-12 text-primary/60 group-hover:text-primary transition-colors mb-4" />
              <h3 className="text-lg font-semibold text-primary/80 group-hover:text-primary">
                Adicionar Serviço
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                Clique para criar um novo serviço
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-primary/20 bg-gradient-to-br from-card to-card/80">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-primary rounded-full"></div>
                <span className="text-sm font-medium text-muted-foreground">Total de Serviços</span>
              </div>
              <div className="text-3xl font-bold text-primary mt-2">
                {servicos.length}
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-primary/20 bg-gradient-to-br from-card to-card/80">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-muted-foreground">Preço Médio</span>
              </div>
              <div className="text-3xl font-bold text-green-600 mt-2">
                R$ {servicos.length > 0 ? (servicos.reduce((acc, s) => acc + s.preco, 0) / servicos.length).toFixed(2) : '0.00'}
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-primary/20 bg-gradient-to-br from-card to-card/80">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-muted-foreground">Duração Média</span>
              </div>
              <div className="text-3xl font-bold text-blue-600 mt-2">
                {servicos.length > 0 ? Math.round(servicos.reduce((acc, s) => acc + s.tempo_duracao, 0) / servicos.length) : 0} min
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}