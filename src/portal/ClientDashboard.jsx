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
        <div className={`${styles.stat} ${styles.statPurple}`}><div className={styles.statIcon}>📋</div><strong>{stats.total}</strong><span>Total Tasks</span></div>
        <div className={`${styles.stat} ${styles.statYellow}`}><div className={styles.statIcon}>🕐</div><strong>{stats.pending}</strong><span>Pending</span></div>
        <div className={`${styles.stat} ${styles.statBlue}`}><div className={styles.statIcon}>⚡</div><strong>{stats.active}</strong><span>In Progress</span></div>
        <div className={`${styles.stat} ${styles.statGreen}`}><div className={styles.statIcon}>✅</div><strong>{stats.done}</strong><span>Completed</span></div>
      </div>

      <div className={styles.section}>
        <h2>Recent Tasks</h2>
        {loading ? <p className={styles.empty}>Loading...</p> : tasks.length === 0 ? (
          <div className={styles.onboarding}>
            <div className={styles.onboardingHeader}>
              <span className={styles.onboardingEmoji}>👋</span>
              <div>
                <h3>Welcome! Let's get you started.</h3>
                <p>Here are a few things to do first:</p>
              </div>
            </div>
            <div className={styles.checkList}>
              {[
                { icon: '✅', text: 'Account created', done: true },
                { icon: '📝', text: 'Submit your first request', done: false, link: '/portal/tasks/new' },
                { icon: '💬', text: 'Chat with Joy about your needs', done: false },
                { icon: '📅', text: 'Set due dates on your tasks', done: false },
              ].map((item, i) => (
                <div key={i} className={`${styles.checkItem} ${item.done ? styles.checkDone : ''}`}>
                  <span className={styles.checkIcon}>{item.done ? '✅' : '○'}</span>
                  {item.link
                    ? <Link to={item.link} className={styles.checkLink}>{item.text}</Link>
                    : <span className={styles.checkText}>{item.text}</span>
                  }
                </div>
              ))}
            </div>
            <Link to="/portal/tasks/new" className={styles.newBtn} style={{display:'inline-block',marginTop:'16px'}}>Submit your first request →</Link>
          </div>
        ) : (
          <div className={styles.taskList}>
            {tasks.slice(0, 5).map(task => (
              <Link to={`/portal/tasks/${task.id}`} key={task.id} className={styles.taskRow}>
                <div className={styles.taskLeft}>
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
