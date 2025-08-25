import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from './AuthProvider'
import { useToast } from '@/hooks/use-toast'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signInWithEmail, signUpWithEmail } = useAuth()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isSignUp) {
        await signUpWithEmail(email, password)
        toast({
          title: 'Sucesso!',
          description: 'Conta criada com sucesso. Verifique seu email.',
        })
      } else {
        await signInWithEmail(email, password)
        toast({
          title: 'Bem-vindo!',
          description: 'Login realizado com sucesso.',
        })
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao fazer login',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
      <Card className="w-full max-w-md bg-card/90 backdrop-blur-sm border border-primary/20 shadow-neon">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">✂️</span>
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-neon bg-clip-text text-transparent">
            Barbearia França
          </CardTitle>
          <p className="text-muted-foreground">
            {isSignUp ? 'Criar nova conta' : 'Acesse o sistema'}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="bg-background/50 border-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="bg-background/50 border-primary/20 focus:border-primary"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-gradient-primary hover:shadow-neon"
              disabled={loading}
            >
              {loading ? 'Carregando...' : isSignUp ? 'Criar Conta' : 'Entrar'}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <Button
              variant="link"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary"
            >
              {isSignUp 
                ? 'Já tem uma conta? Faça login' 
                : 'Não tem conta? Cadastre-se'
              }
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}