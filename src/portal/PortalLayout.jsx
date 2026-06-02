import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import styles from './PortalLayout.module.css'
import NotificationBell from './NotificationBell'
import SearchModal from './SearchModal'

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
    function handleKeyDown(e) {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const navItems = user?.role === 'admin'
    ? [
        { to: '/admin', label: '📊 Dashboard', end: true },
        { to: '/admin/tasks', label: '✅ All Tasks' },
        { to: '/admin/calendar', label: '📅 Calendar' },
        { to: '/admin/clients', label: '👥 Clients' },
        { to: '/admin/analytics', label: '📈 Analytics' },
        { to: '/admin/invoices', label: '🧾 Invoices' },
      ]
    : [
        { to: '/portal', label: '🏠 Dashboard', end: true },
        { to: '/portal/tasks', label: '✅ My Tasks' },
        { to: '/portal/tasks/new', label: '➕ New Request' },
        { to: '/portal/invoices', label: '🧾 Invoices' },
      ]

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>Joy<span>.</span></div>
        <button className={styles.searchBtn} onClick={() => setSearchOpen(true)}>🔍 Search <kbd>Ctrl+K</kbd></button>
        <p className={styles.roleTag}>{user?.role === 'admin' ? '⚡ Admin' : '👤 Client Portal'}</p>
        <nav className={styles.nav}>
          {navItems.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}>
              {label}
            </NavLink>
          ))}
        </nav>
        <NotificationBell />
        <button className={styles.themeToggle} onClick={() => setDark(d => !d)}>{dark ? '☀️ Light Mode' : '🌙 Dark Mode'}</button>
        <div className={styles.userInfo}>
          <div className={styles.avatar}>{user?.name?.[0]}</div>
          <div>
            <strong>{user?.name}</strong>
            <span>{user?.email}</span>
          </div>
        </div>
        <button className={styles.logout} onClick={handleLogout}>Sign Out</button>
      </aside>
      <main className={styles.main}>{children}</main>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}
