import Sidebar from '@/components/Sidebar'
import BottomNav from '@/components/BottomNav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        {children}
      </div>
      <BottomNav />
    </div>
  )
}
