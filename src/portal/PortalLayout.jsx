import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import styles from './PortalLayout.module.css'
import NotificationBell from './NotificationBell'
import SearchModal from './SearchModal'

const adminNav = [
  { to: '/admin', label: 'Dashboard', icon: '🏠', end: true },
  { to: '/admin/tasks', label: 'All Tasks', icon: '✅' },
  { to: '/admin/calendar', label: 'Calendar', icon: '📅' },
  { to: '/admin/clients', label: 'Clients', icon: '👥' },
  { to: '/admin/analytics', label: 'Analytics', icon: '📈' },
  { to: '/admin/invoices', label: 'Invoices', icon: '🧾' },
]

const clientNav = [
  { to: '/portal', label: 'Dashboard', icon: '🏠', end: true },
  { to: '/portal/tasks', label: 'My Tasks', icon: '✅' },
  { to: '/portal/tasks/new', label: 'New Request', icon: '➕' },
  { to: '/portal/invoices', label: 'Invoices', icon: '🧾' },
]

export default function PortalLayout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    if (saved) document.documentElement.setAttribute('data-theme', saved)
  }, [])

  useEffect(() => {
    function onKey(e) {
      if (e.ctrlKey && e.key === 'k') { e.preventDefault(); setSearchOpen(true) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const navItems = user?.role === 'admin' ? adminNav : clientNav

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTop}>
          <div className={styles.logo}>Joy<span>.</span></div>
          <div className={styles.userCard}>
            <div className={styles.avatar}>{user?.name?.[0]}</div>
            <div>
              <strong>{user?.name}</strong>
              <span>{user?.role === 'admin' ? 'Admin' : 'Client'}</span>
            </div>
            <span className={styles.verifiedIcon}>✓</span>
          </div>
        </div>

        <nav className={styles.nav}>
          <span className={styles.navLabel}>Main Menu</span>
          {navItems.map(({ to, label, icon, end }) => (
            <NavLink
              key={to} to={to} end={end}
              className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
            >
              <span>{label}</span>
              <span className={styles.linkIcon}>{icon}</span>
            </NavLink>
          ))}
        </nav>

        <div className={styles.sidebarBottom}>
          <NotificationBell />
          <button className={styles.themeToggle} onClick={() => setDark(d => !d)}>
            {dark ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
          <button className={styles.logout} onClick={() => { logout(); navigate('/login') }}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Right side */}
      <div className={styles.rightSide}>
        {/* Top header */}
        <header className={styles.header}>
          <button className={styles.headerSearch} onClick={() => setSearchOpen(true)}>
            🔍 Search tasks...
            <kbd>Ctrl+K</kbd>
          </button>
          <div className={styles.headerRight}>
            <div className={styles.headerUser}>
              <div className={styles.headerAvatar}>{user?.name?.[0]}</div>
              {user?.name}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className={styles.main}>{children}</main>
      </div>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}
