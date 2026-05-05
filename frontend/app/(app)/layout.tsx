import BottomNav from '@/components/BottomNav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <main className="pb-safe" style={{ flex: 1 }}>
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
