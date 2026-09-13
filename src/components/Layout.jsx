import { Outlet } from 'react-router-dom'
import Header from './Header'
import SubNav from './SubNav'

export default function Layout() {
  return (
    <div className="min-h-screen bg-[var(--surface-page)]">
      <Header />
      <SubNav />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}
