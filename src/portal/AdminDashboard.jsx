import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from './api'
import { StatusBadge, PriorityBadge } from './Badges'
import styles from './Dashboard.module.css'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.getStats(), api.getTasks()])
      .then(([s, t]) => { setStats(s); setTasks(t) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p style={{color:'#6b7280'}}>Loading...</p>

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1>Admin Dashboard ⚡</h1>
          <p>Overview of all clients and tasks.</p>
        </div>
        <Link to="/admin/clients" className={styles.newBtn}>👥 View Clients</Link>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.stat}><strong>{stats?.total_clients}</strong><span>Total Clients</span></div>
        <div className={`${styles.stat} ${styles.yellow}`}><strong>{stats?.pending_tasks}</strong><span>Pending</span></div>
        <div className={`${styles.stat} ${styles.blue}`}><strong>{stats?.active_tasks}</strong><span>In Progress</span></div>
        <div className={`${styles.stat} ${styles.green}`}><strong>{stats?.completed_tasks}</strong><span>Completed</span></div>
      </div>

      <div className={styles.section}>
        <h2>Recent Tasks</h2>
        <div className={styles.taskList}>
          {tasks.slice(0, 8).map(task => (
            <Link to={`/admin/tasks/${task.id}`} key={task.id} className={styles.taskRow}>
              <div>
                <strong>{task.title}</strong>
                <span>👤 {task.client_name} · {task.service_type}</span>
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
    </div>
  )
}
