import { useEffect, useState } from 'react'
import { api } from './api'
import styles from './ClientList.module.css'

export default function ClientList() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { api.getClients().then(setClients).finally(() => setLoading(false)) }, [])

  return (
    <div>
      <h1 className={styles.title}>Clients</h1>
      {loading ? <p className={styles.empty}>Loading...</p> :
        clients.length === 0 ? <p className={styles.empty}>No clients yet.</p> :
        <div className={styles.grid}>
          {clients.map(c => (
            <div key={c.id} className={styles.card}>
              <div className={styles.avatar}>{c.name[0]}</div>
              <div className={styles.info}>
                <strong>{c.name}</strong>
                <span>{c.email}</span>
                {c.company && <span className={styles.company}>{c.company}</span>}
              </div>
              <div className={styles.stats}>
                <div><strong>{c.task_count}</strong><span>Tasks</span></div>
                <div><strong>{c.completed_count}</strong><span>Done</span></div>
              </div>
              <span className={styles.since}>Since {new Date(c.created_at).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      }
    </div>
  )
}
