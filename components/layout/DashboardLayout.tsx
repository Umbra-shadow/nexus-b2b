import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-0">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
