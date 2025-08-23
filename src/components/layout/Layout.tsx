import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/AppSidebar"

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-subtle">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="h-16 flex items-center border-b border-border bg-card/80 backdrop-blur-sm shadow-elegant">
            <SidebarTrigger className="ml-4" />
            <div className="ml-4 flex items-center gap-3">
              <img 
                src="/franca-logo.png" 
                alt="Barbearia França Logo" 
                className="w-10 h-10 rounded-full object-cover"
              />
              <h1 className="font-bold text-xl text-card-foreground">
                Barbearia França
              </h1>
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