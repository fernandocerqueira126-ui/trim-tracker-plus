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
              <div className="w-8 h-8 bg-gradient-luxury rounded-full flex items-center justify-center">
                <span className="text-accent-foreground font-bold text-sm">✂️</span>
              </div>
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