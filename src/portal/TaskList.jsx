import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { api } from './api'
import { StatusBadge, PriorityBadge } from './Badges'
import styles from './TaskList.module.css'

const STATUSES = ['all','pending','in_progress','completed','cancelled']

export default function TaskList() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    api.getTasks().then(setTasks).finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter)

  return (
    <div>
      <div className={styles.header}>
        <h1>{isAdmin ? 'All Tasks' : 'My Tasks'}</h1>
        {!isAdmin && <Link to="/portal/tasks/new" className={styles.newBtn}>+ New Request</Link>}
      </div>

      <div className={styles.filters}>
        {STATUSES.map(s => (
          <button key={s} className={`${styles.filter} ${filter === s ? styles.active : ''}`}
            onClick={() => setFilter(s)}>
            {s === 'all' ? 'All' : s.replace('_',' ')}
          </button>
        ))}
      </div>

      {loading ? <p className={styles.empty}>Loading...</p> :
        filtered.length === 0 ? <p className={styles.empty}>No tasks found.</p> :
        <div className={styles.list}>
          {filtered.map(task => (
            <Link to={`${isAdmin ? '/admin' : '/portal'}/tasks/${task.id}`} key={task.id} className={styles.row}>
              <div className={styles.rowLeft}>
                <strong>{task.title}</strong>
                <span>{isAdmin ? `👤 ${task.client_name} · ` : ''}{task.service_type || 'General'}</span>
              </div>
              <div className={styles.rowRight}>
                <PriorityBadge priority={task.priority} />
                <StatusBadge status={task.status} />
                <span className={styles.date}>{new Date(task.created_at).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
      }
    </div>
  )
}
