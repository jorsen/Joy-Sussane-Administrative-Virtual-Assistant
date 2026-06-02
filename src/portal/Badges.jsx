import styles from './Badges.module.css'

const statusColors = {
  pending: 'yellow', in_progress: 'blue', completed: 'green', cancelled: 'red'
}
const statusLabels = {
  pending: 'Pending', in_progress: 'In Progress', completed: 'Completed', cancelled: 'Cancelled'
}
const priorityColors = { low: 'gray', medium: 'orange', high: 'red' }

export function StatusBadge({ status }) {
  return <span className={`${styles.badge} ${styles[statusColors[status]]}`}>{statusLabels[status]}</span>
}

export function PriorityBadge({ priority }) {
  return <span className={`${styles.badge} ${styles[priorityColors[priority]]}`}>{priority}</span>
}
