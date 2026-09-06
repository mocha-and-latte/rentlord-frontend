import {
  Bell,
  Building2,
  ClipboardList,
  FileText,
  Gauge,
  LogOut,
  Menu,
  Settings2,
  Users,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { useLocale } from '../lib/locale'
const nav = [
  [Gauge, 'แดชบอร์ด', 'Dashboard', '/dashboard'],
  [Building2, 'ยูนิต', 'Units', '/units'],
  [Users, 'ผู้เช่า', 'Tenants', '/tenants'],
  [FileText, 'สัญญา', 'Agreements', '/agreements'],
  [ClipboardList, 'ใบแจ้งหนี้', 'Invoices', '/invoices'],
  [Settings2, 'ตั้งค่า', 'Settings', '/settings'],
  [Bell, 'แจ้งเตือน', 'Notifications', '/notifications'],
] as const
export function AppShell() {
  const [open, setOpen] = useState(false)
  const { signOut } = useAuth()
  const { locale, toggle } = useLocale()
  const { pathname } = useLocation()
  return (
    <div className="app">
      <aside className={open ? 'sidebar open' : 'sidebar'}>
        <div className="brand">
          <span>R</span>Rentlord
          <button className="mobile-close" onClick={() => setOpen(false)}>
            <X />
          </button>
        </div>
        <nav>
          {nav.map(([Icon, th, en, to]) => (
            <NavLink
              key={to}
              to={to}
              className={
                to === '/settings' &&
                (pathname.startsWith('/custom-fields') ||
                  pathname.startsWith('/agreement-templates'))
                  ? 'active'
                  : undefined
              }
              onClick={() => setOpen(false)}
            >
              <Icon size={19} />
              {locale === 'th' ? th : en}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          <button className="text-button" onClick={toggle}>
            {locale === 'th' ? 'EN · English' : 'ไทย · Thai'}
          </button>
          <button className="text-button danger" onClick={signOut}>
            <LogOut size={17} />
            {locale === 'th' ? 'ออกจากระบบ' : 'Sign out'}
          </button>
        </div>
      </aside>
      {open && <button className="backdrop" onClick={() => setOpen(false)} />}
      <main>
        <header className="topbar">
          <button className="menu-button" onClick={() => setOpen(true)}>
            <Menu />
          </button>
          <div />
          <NavLink className="notification-button" to="/notifications">
            <Bell size={20} />
          </NavLink>
        </header>
        <div className="content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
