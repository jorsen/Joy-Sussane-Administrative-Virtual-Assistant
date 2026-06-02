import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { api } from './api'
import { StatusBadge, PriorityBadge } from './Badges'
import styles from './Dashboard.module.css'

function toDateKey(d) { return d ? d.substring(0, 10) : null }

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const todayKey = (() => {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`
})()

export default function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.getStats(), api.getTasks()])
      .then(([s, t]) => { setStats(s); setTasks(t) })
      .finally(() => setLoading(false))
  }, [])

  const overdue = tasks.filter(t =>
    t.due_date && t.status !== 'completed' && t.status !== 'cancelled' && toDateKey(t.due_date) < todayKey
  )
  const dueToday = tasks.filter(t =>
    t.due_date && t.status !== 'completed' && t.status !== 'cancelled' && toDateKey(t.due_date) === todayKey
  )
  const upcoming = tasks.filter(t =>
    t.due_date && t.status !== 'completed' && t.status !== 'cancelled' && toDateKey(t.due_date) > todayKey
  ).slice(0, 6)

  if (loading) return <p className={styles.loadingText}>Loading...</p>

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1>{greeting()}, {user?.name?.split(' ')[0]} 👋</h1>
          <p>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>
        <div className={styles.headerActions}>
          <Link to="/admin/calendar" className={styles.calBtn}>📅 Calendar</Link>
          <Link to="/admin/clients" className={styles.newBtn}>👥 Clients</Link>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={`${styles.stat} ${styles.statPurple}`}>
          <div className={styles.statIcon}>👥</div>
          <strong>{stats?.total_clients ?? '—'}</strong>
          <span>Total Clients</span>
        </div>
        <div className={`${styles.stat} ${styles.statYellow}`}>
          <div className={styles.statIcon}>🕐</div>
          <strong>{stats?.pending_tasks ?? '—'}</strong>
          <span>Pending</span>
        </div>
        <div className={`${styles.stat} ${styles.statBlue}`}>
          <div className={styles.statIcon}>⚡</div>
          <strong>{stats?.active_tasks ?? '—'}</strong>
          <span>In Progress</span>
        </div>
        <div className={`${styles.stat} ${styles.statGreen}`}>
          <div className={styles.statIcon}>✅</div>
          <strong>{stats?.completed_tasks ?? '—'}</strong>
          <span>Completed</span>
        </div>
      </div>

      {(overdue.length > 0 || dueToday.length > 0) && (
        <div className={styles.alertRow}>
          {overdue.length > 0 && (
            <div className={`${styles.alertCard} ${styles.alertRed}`}>
              <div className={styles.alertHeader}>
                <span>🚨</span>
                <strong>Overdue — {overdue.length} task{overdue.length > 1 ? 's' : ''}</strong>
              </div>
              <div className={styles.alertList}>
                {overdue.slice(0, 3).map(t => (
                  <Link key={t.id} to={`/admin/tasks/${t.id}`} className={styles.alertItem}>
                    <span className={styles.alertTitle}>{t.title}</span>
                    <span className={styles.alertClient}>{t.client_name}</span>
                  </Link>
                ))}
                {overdue.length > 3 && <span className={styles.alertMore}>+{overdue.length - 3} more</span>}
              </div>
            </div>
          )}
          {dueToday.length > 0 && (
            <div className={`${styles.alertCard} ${styles.alertOrange}`}>
              <div className={styles.alertHeader}>
                <span>📌</span>
                <strong>Due Today — {dueToday.length} task{dueToday.length > 1 ? 's' : ''}</strong>
              </div>
              <div className={styles.alertList}>
                {dueToday.slice(0, 3).map(t => (
                  <Link key={t.id} to={`/admin/tasks/${t.id}`} className={styles.alertItem}>
                    <span className={styles.alertTitle}>{t.title}</span>
                    <span className={styles.alertClient}>{t.client_name}</span>
                  </Link>
                ))}
                {dueToday.length > 3 && <span className={styles.alertMore}>+{dueToday.length - 3} more</span>}
              </div>
            </div>
          )}
        </div>
      )}

      <div className={styles.twoCol}>
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Recent Tasks</h2>
            <Link to="/admin/tasks" className={styles.seeAll}>See all →</Link>
          </div>
          <div className={styles.taskList}>
            {tasks.length === 0 && <p className={styles.empty}>No tasks yet.</p>}
            {tasks.slice(0, 8).map(task => (
              <Link to={`/admin/tasks/${task.id}`} key={task.id} className={styles.taskRow}>
                <div className={styles.taskLeft}>
                  <strong>{task.title}</strong>
                  <span>👤 {task.client_name}{task.service_type ? ` · ${task.service_type}` : ''}</span>
                </div>
                <div className={styles.taskMeta}>
                  <PriorityBadge priority={task.priority} />
                  <StatusBadge status={task.status} />
                  <span className={styles.date}>{new Date(task.created_at).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Upcoming Due Dates</h2>
            <Link to="/admin/calendar" className={styles.seeAll}>Calendar →</Link>
          </div>
          {upcoming.length === 0 ? (
            <div className={styles.emptyUpcoming}>
              <span>📅</span>
              <p>No upcoming deadlines.</p>
            </div>
          ) : (
            <div className={styles.upcomingList}>
              {upcoming.map(t => {
                const dueDate = new Date(toDateKey(t.due_date) + 'T00:00:00')
                const diff = Math.ceil((dueDate - new Date(todayKey + 'T00:00:00')) / (1000 * 60 * 60 * 24))
                return (
                  <Link key={t.id} to={`/admin/tasks/${t.id}`} className={styles.upcomingRow}>
                    <div className={`${styles.dueBadge} ${diff <= 2 ? styles.dueUrgent : diff <= 5 ? styles.dueSoon : styles.dueOk}`}>
                      {diff === 1 ? 'Tomorrow' : `${diff}d`}
                    </div>
                    <div className={styles.upcomingInfo}>
                      <strong>{t.title}</strong>
                      <span>👤 {t.client_name}</span>
                    </div>
                    <PriorityBadge priority={t.priority} />
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
