import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { AppSidebar } from "@/components/layout/AppSidebar"
import { useAuth } from "@/components/auth/AuthProvider"
import { useToast } from "@/hooks/use-toast"

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { signOut, user } = useAuth()
  const { toast } = useToast()

  const handleSignOut = async () => {
    try {
      await signOut()
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso."
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao fazer logout",
        variant: "destructive"
      })
    }
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-subtle">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="h-16 flex items-center justify-between border-b border-border bg-card/80 backdrop-blur-sm shadow-elegant px-4">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <div className="w-8 h-8 bg-gradient-luxury rounded-full flex items-center justify-center">
                <span className="text-accent-foreground font-bold text-sm">✂️</span>
              </div>
              <h1 className="font-bold text-xl text-card-foreground">
                Barbearia França
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {user?.email}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSignOut}
                className="border-primary/20 hover:bg-primary/10"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </header>

          <main className="flex-1 p-8 bg-gradient-subtle">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}