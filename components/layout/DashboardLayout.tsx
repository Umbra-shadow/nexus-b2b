import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { TopBar } from './TopBar'
import { DemoIntroModal } from './DemoIntroModal'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--nx-bg)' }}>
      <DemoIntroModal />
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, paddingBottom: 64 }}>
        <TopBar />
        <div style={{ flex: 1, overflow: 'auto' }}>
          {children}
        </div>
      </main>
      <BottomNav />
      <style>{`
        @media (min-width: 1024px) {
          main { padding-bottom: 0; }
        }
      `}</style>
    </div>
  )
}
