import { NavLink } from 'react-router-dom'
import BackupControls from './BackupControls'

const tabClass = ({ isActive }) =>
  `border-b-2 px-1 py-3 text-sm font-medium transition ${
    isActive
      ? 'border-[var(--brass)] text-[var(--ink)]'
      : 'border-transparent text-[var(--ink-muted)] hover:text-[var(--ink)]'
  }`

export default function SubNav() {
  return (
    <div className="border-b border-[var(--line)] bg-[var(--surface-card)]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6">
        <nav className="flex gap-6">
          <NavLink to="/" end className={tabClass}>
            Aktif Misafirler
          </NavLink>
          <NavLink to="/arsiv" className={tabClass}>
            Arşiv
          </NavLink>
        </nav>
        <BackupControls />
      </div>
    </div>
  )
}
