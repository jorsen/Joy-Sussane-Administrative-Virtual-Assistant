import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import styles from './PortalLayout.module.css'

export default function PortalLayout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const navItems = user?.role === 'admin'
    ? [
        { to: '/admin', label: '📊 Dashboard', end: true },
        { to: '/admin/tasks', label: '✅ All Tasks' },
        { to: '/admin/clients', label: '👥 Clients' },
      ]
    : [
        { to: '/portal', label: '🏠 Dashboard', end: true },
        { to: '/portal/tasks', label: '✅ My Tasks' },
        { to: '/portal/tasks/new', label: '➕ New Request' },
      ]

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>Joy<span>.</span></div>
        <p className={styles.roleTag}>{user?.role === 'admin' ? '⚡ Admin' : '👤 Client Portal'}</p>
        <nav className={styles.nav}>
          {navItems.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}>
              {label}
            </NavLink>
          ))}
        </nav>
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
    </div>
  )
}
