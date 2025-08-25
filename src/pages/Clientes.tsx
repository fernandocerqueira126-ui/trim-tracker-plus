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

interface Cliente {
  id: string
  nome: string
  telefone?: string
  email?: string
  data_cadastro: string
  ultima_visita?: string
}

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: ''
  })
  const { toast } = useToast()

  useEffect(() => {
    loadClientes()

    // Configurar real-time updates
    const channel = supabase
      .channel('clientes-realtime')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'clientes' 
      }, () => {
        loadClientes()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function loadClientes() {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('nome')

      if (error) throw error
      setClientes(data || [])
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar clientes",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    try {
      if (editingCliente) {
        const { error } = await supabase
          .from('clientes')
          .update(formData)
          .eq('id', editingCliente.id)

        if (error) throw error
        toast({ title: "Sucesso", description: "Cliente atualizado com sucesso!" })
      } else {
        const { error } = await supabase
          .from('clientes')
          .insert([formData])

        if (error) throw error
        toast({ title: "Sucesso", description: "Cliente adicionado com sucesso!" })
      }

      setOpen(false)
      setEditingCliente(null)
      setFormData({ nome: '', telefone: '', email: '' })
      loadClientes()
    } catch (error) {
      console.error('Erro ao salvar cliente:', error)
      toast({
        title: "Erro",
        description: "Erro ao salvar cliente",
        variant: "destructive"
      })
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return

    try {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast({ title: "Sucesso", description: "Cliente excluído com sucesso!" })
      loadClientes()
    } catch (error) {
      console.error('Erro ao excluir cliente:', error)
      toast({
        title: "Erro",
        description: "Erro ao excluir cliente",
        variant: "destructive"
      })
    }
  }

  function openEditDialog(cliente: Cliente) {
    setEditingCliente(cliente)
    setFormData({
      nome: cliente.nome,
      telefone: cliente.telefone || '',
      email: cliente.email || ''
    })
    setOpen(true)
  }

  function openAddDialog() {
    setEditingCliente(null)
    setFormData({ nome: '', telefone: '', email: '' })
    setOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Carregando clientes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header com visual moderno */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-bold bg-gradient-neon bg-clip-text text-transparent">
            Gestão de Clientes
          </h1>
          <p className="text-muted-foreground text-lg flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary">
              {clientes.length} {clientes.length === 1 ? 'cliente' : 'clientes'}
            </span>
            cadastrados no sistema
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog} className="bg-gradient-primary hover:shadow-neon transition-all duration-300">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card/95 backdrop-blur-sm border border-primary/20">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">
                {editingCliente ? 'Editar Cliente' : 'Novo Cliente'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nome" className="text-sm font-medium">Nome Completo</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                  className="bg-background/50 border-primary/20 focus:border-primary"
                  placeholder="Digite o nome completo"
                />
              </div>
              <div>
                <Label htmlFor="telefone" className="text-sm font-medium">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  className="bg-background/50 border-primary/20 focus:border-primary"
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-sm font-medium">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-background/50 border-primary/20 focus:border-primary"
                  placeholder="cliente@email.com"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1 bg-gradient-primary hover:shadow-neon">
                  {editingCliente ? 'Atualizar Cliente' : 'Salvar Cliente'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-primary/20">
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Card da lista de clientes */}
      <Card className="bg-card/80 backdrop-blur-sm border border-primary/20 shadow-neon">
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            Lista de Clientes
            <span className="text-sm font-normal text-muted-foreground">
              ({clientes.length} total)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {clientes.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="h-8 w-8 text-primary/50" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">Nenhum cliente cadastrado</h3>
              <p className="text-muted-foreground mb-4">Comece adicionando seu primeiro cliente</p>
              <Button onClick={openAddDialog} className="bg-gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeiro Cliente
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-primary/20">
                    <TableHead className="font-semibold">Nome</TableHead>
                    <TableHead className="font-semibold">Telefone</TableHead>
                    <TableHead className="font-semibold">E-mail</TableHead>
                    <TableHead className="font-semibold">Cadastro</TableHead>
                    <TableHead className="font-semibold text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientes.map((cliente) => (
                    <TableRow key={cliente.id} className="border-primary/10 hover:bg-primary/5 transition-colors">
                      <TableCell className="font-medium">{cliente.nome}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {cliente.telefone || (
                          <span className="italic text-muted-foreground/60">Não informado</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {cliente.email || (
                          <span className="italic text-muted-foreground/60">Não informado</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(cliente.data_cadastro).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(cliente)}
                            className="border-primary/20 hover:bg-primary/10 hover:border-primary/40"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(cliente.id)}
                            className="hover:shadow-red-500/20"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}