import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { api } from './api'
import { StatusBadge, PriorityBadge } from './Badges'
import styles from './Dashboard.module.css'

export default function ClientDashboard() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getTasks().then(setTasks).finally(() => setLoading(false))
  }, [])

  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    active: tasks.filter(t => t.status === 'in_progress').length,
    done: tasks.filter(t => t.status === 'completed').length,
  }

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1>Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
          <p>Here's an overview of your tasks and requests.</p>
        </div>
        <Link to="/portal/tasks/new" className={styles.newBtn}>+ New Request</Link>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.stat}><strong>{stats.total}</strong><span>Total Tasks</span></div>
        <div className={`${styles.stat} ${styles.yellow}`}><strong>{stats.pending}</strong><span>Pending</span></div>
        <div className={`${styles.stat} ${styles.blue}`}><strong>{stats.active}</strong><span>In Progress</span></div>
        <div className={`${styles.stat} ${styles.green}`}><strong>{stats.done}</strong><span>Completed</span></div>
      </div>

      <div className={styles.section}>
        <h2>Recent Tasks</h2>
        {loading ? <p className={styles.empty}>Loading...</p> : tasks.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No tasks yet.</p>
            <Link to="/portal/tasks/new" className={styles.newBtn}>Submit your first request →</Link>
          </div>
        ) : (
          <div className={styles.taskList}>
            {tasks.slice(0, 5).map(task => (
              <Link to={`/portal/tasks/${task.id}`} key={task.id} className={styles.taskRow}>
                <div>
                  <strong>{task.title}</strong>
                  <span>{task.service_type}</span>
                </div>
                <div className={styles.taskMeta}>
                  <PriorityBadge priority={task.priority} />
                  <StatusBadge status={task.status} />
                  <span className={styles.date}>{new Date(task.created_at).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
