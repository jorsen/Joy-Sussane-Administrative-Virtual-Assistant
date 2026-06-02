import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from './api'
import { StatusBadge, PriorityBadge } from './Badges'
import styles from './Calendar.module.css'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function toDateKey(dateStr) {
  return dateStr ? dateStr.substring(0, 10) : null
}

function cellKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export default function Calendar() {
  const [tasks, setTasks] = useState([])
  const [current, setCurrent] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)

  const today = new Date()
  const todayKey = cellKey(today.getFullYear(), today.getMonth(), today.getDate())

  useEffect(() => {
    api.getTasks().then(setTasks).finally(() => setLoading(false))
  }, [])

  const { year, month } = current

  const tasksByDate = {}
  const unscheduled = []
  tasks.forEach(task => {
    const key = toDateKey(task.due_date)
    if (!key) { unscheduled.push(task); return }
    if (!tasksByDate[key]) tasksByDate[key] = []
    tasksByDate[key].push(task)
  })

  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells = []
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  function prev() {
    setSelected(null)
    setCurrent(c => c.month === 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: c.month - 1 })
  }
  function next() {
    setSelected(null)
    setCurrent(c => c.month === 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: c.month + 1 })
  }
  function goToday() {
    const now = new Date()
    setSelected(now.getDate())
    setCurrent({ year: now.getFullYear(), month: now.getMonth() })
  }

  const selectedKey = selected ? cellKey(year, month, selected) : null
  const selectedTasks = selectedKey ? (tasksByDate[selectedKey] || []) : []

  const overdueTasks = tasks.filter(t => {
    if (!t.due_date || t.status === 'completed' || t.status === 'cancelled') return false
    return toDateKey(t.due_date) < todayKey
  })

  if (loading) return <p className={styles.loading}>Loading calendar...</p>

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1>Calendar</h1>
          <p>{tasks.filter(t => t.due_date).length} scheduled · {unscheduled.length} unscheduled</p>
        </div>
        <button className={styles.todayBtn} onClick={goToday}>Today</button>
      </div>

      {overdueTasks.length > 0 && (
        <div className={styles.overdueAlert}>
          <span className={styles.overdueIcon}>⚠️</span>
          <strong>{overdueTasks.length} overdue task{overdueTasks.length > 1 ? 's' : ''}</strong>
          <div className={styles.overdueTasks}>
            {overdueTasks.map(t => (
              <Link key={t.id} to={`/admin/tasks/${t.id}`} className={styles.overdueChip}>
                {t.title}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className={styles.calendarCard}>
        <div className={styles.calHeader}>
          <button className={styles.navBtn} onClick={prev}>‹</button>
          <h2>{MONTHS[month]} {year}</h2>
          <button className={styles.navBtn} onClick={next}>›</button>
        </div>

        <div className={styles.grid}>
          {DAYS.map(d => <div key={d} className={styles.dayLabel}>{d}</div>)}
          {cells.map((d, i) => {
            if (!d) return <div key={`e-${i}`} />
            const key = cellKey(year, month, d)
            const dayTasks = tasksByDate[key] || []
            const isToday = key === todayKey
            const isSelected = selected === d
            const isPast = key < todayKey
            const hasPending = dayTasks.some(t => t.status !== 'completed' && t.status !== 'cancelled')

            return (
              <div
                key={d}
                className={`${styles.cell} ${isToday ? styles.todayCell : ''} ${isSelected ? styles.selectedCell : ''} ${isPast && hasPending ? styles.overdueCell : ''}`}
                onClick={() => setSelected(d === selected ? null : d)}
              >
                <span className={`${styles.dayNum} ${isToday ? styles.todayNum : ''}`}>{d}</span>
                <div className={styles.taskDots}>
                  {dayTasks.slice(0, 4).map(t => (
                    <span key={t.id} className={`${styles.dot} ${styles['dot_' + t.priority]} ${t.status === 'completed' ? styles.dotDone : ''}`} title={t.title} />
                  ))}
                  {dayTasks.length > 4 && <span className={styles.dotMore}>+{dayTasks.length - 4}</span>}
                </div>
              </div>
            )
          })}
        </div>

        <div className={styles.legend}>
          <span><span className={`${styles.dot} ${styles.dot_high}`} /> High</span>
          <span><span className={`${styles.dot} ${styles.dot_medium}`} /> Medium</span>
          <span><span className={`${styles.dot} ${styles.dot_low}`} /> Low</span>
          <span><span className={`${styles.dot} ${styles.dotDone}`} /> Done</span>
        </div>
      </div>

      {selected && (
        <div className={styles.dayPanel}>
          <h3>
            {new Date(year, month, selected).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </h3>
          {selectedTasks.length === 0 ? (
            <p className={styles.noTasks}>No tasks due on this day.</p>
          ) : (
            <div className={styles.taskList}>
              {selectedTasks.map(t => (
                <Link key={t.id} to={`/admin/tasks/${t.id}`} className={styles.taskRow}>
                  <span className={`${styles.priorityBar} ${styles['bar_' + t.priority]}`} />
                  <div className={styles.taskInfo}>
                    <strong>{t.title}</strong>
                    {t.client_name && <span>👤 {t.client_name}</span>}
                    {t.service_type && <span>{t.service_type}</span>}
                  </div>
                  <div className={styles.taskBadges}>
                    <PriorityBadge priority={t.priority} />
                    <StatusBadge status={t.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {unscheduled.length > 0 && (
        <div className={styles.unscheduled}>
          <h3>Unscheduled Tasks <span className={styles.count}>{unscheduled.length}</span></h3>
          <div className={styles.taskList}>
            {unscheduled.map(t => (
              <Link key={t.id} to={`/admin/tasks/${t.id}`} className={styles.taskRow}>
                <span className={`${styles.priorityBar} ${styles['bar_' + t.priority]}`} />
                <div className={styles.taskInfo}>
                  <strong>{t.title}</strong>
                  {t.client_name && <span>👤 {t.client_name}</span>}
                </div>
                <div className={styles.taskBadges}>
                  <PriorityBadge priority={t.priority} />
                  <StatusBadge status={t.status} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
