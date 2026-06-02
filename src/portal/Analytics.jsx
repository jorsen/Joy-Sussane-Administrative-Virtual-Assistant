import { useEffect, useState } from 'react'
import { api } from './api'
import styles from './Analytics.module.css'

function BarChart({ rows, labelKey, countKey }) {
  const max = Math.max(...rows.map(r => r[countKey]), 1)
  return (
    <div>
      {rows.map((row, i) => (
        <div key={i} className={styles.barRow}>
          <span className={styles.barLabel}>{row[labelKey]}</span>
          <div className={styles.barTrack}>
            <div
              className={styles.barFill}
              style={{ width: `${(row[countKey] / max) * 100}%` }}
            />
          </div>
          <span className={styles.barCount}>{row[countKey]}</span>
        </div>
      ))}
    </div>
  )
}

export default function Analytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.getAnalytics()
      .then(setData)
      .catch(err => setError(err.message || 'Failed to load analytics'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className={styles.loading}>Loading analytics...</p>
  if (error)   return <p className={styles.error}>{error}</p>

  const { monthly = [], services = [], totals = {} } = data
  const topServices = services.slice(0, 6)

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1>Analytics</h1>
        <p>A snapshot of task activity and service usage across your workspace.</p>
      </div>

      {/* Task Overview */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Task Overview</h2>
        <div className={styles.totalsGrid}>
          <div className={styles.totalCard}>
            <div className={styles.totalNum}>{totals.total ?? 0}</div>
            <div className={styles.totalLabel}>Total Tasks</div>
          </div>
          <div className={styles.totalCard}>
            <div className={`${styles.totalNum} ${styles.numPending}`}>{totals.pending ?? 0}</div>
            <div className={styles.totalLabel}>Pending</div>
          </div>
          <div className={styles.totalCard}>
            <div className={`${styles.totalNum} ${styles.numProgress}`}>{totals.in_progress ?? 0}</div>
            <div className={styles.totalLabel}>In Progress</div>
          </div>
          <div className={styles.totalCard}>
            <div className={`${styles.totalNum} ${styles.numCompleted}`}>{totals.completed ?? 0}</div>
            <div className={styles.totalLabel}>Completed</div>
          </div>
        </div>
      </div>

      {/* Monthly Completions */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Monthly Completions</h2>
        {monthly.length === 0
          ? <p className={styles.empty}>No monthly data available.</p>
          : <BarChart rows={monthly} labelKey="month" countKey="completed" />
        }
      </div>

      {/* Top Services */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Top Services</h2>
        {topServices.length === 0
          ? <p className={styles.empty}>No service data available.</p>
          : <BarChart rows={topServices} labelKey="service_type" countKey="count" />
        }
      </div>
    </div>
  )
}
