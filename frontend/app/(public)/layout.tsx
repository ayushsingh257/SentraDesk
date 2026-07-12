import { PublicNavbar } from '@/components/layout/PublicNavbar'
import { PublicFooter } from '@/components/layout/PublicFooter'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <PublicNavbar />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  )
}
