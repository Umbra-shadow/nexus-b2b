import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { TopBar } from './TopBar'
import { DemoIntroModal } from './DemoIntroModal'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--nx-bg)', overflow: 'hidden' }}>
      <DemoIntroModal />
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <TopBar />
        <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
