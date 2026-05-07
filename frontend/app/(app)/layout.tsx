import Sidebar from '@/components/Sidebar'
import BottomNav from '@/components/BottomNav'
import PresenceBar from '@/components/PresenceBar'
import TrialBanner from '@/components/TrialBanner'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <PresenceBar />
        <TrialBanner />
        {children}
      </div>
      <BottomNav />
    </div>
  )
}
