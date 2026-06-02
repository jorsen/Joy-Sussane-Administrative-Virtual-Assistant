import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from './api'
import styles from './NewTask.module.css'

const services = ['Web Research','Social Media Management','Website Management','Admin & Data Entry','Email & Calendar Support','Payment & Records Tracking','Other']

export default function NewTask() {
  const [form, setForm] = useState({ title: '', description: '', service_type: '', priority: 'medium', due_date: '' })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const task = await api.createTask(form)
      navigate(`/portal/tasks/${task.id}`)
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className={styles.page}>
      <Link to="/portal" className={styles.back}>← Back</Link>
      <h1>Submit a New Request</h1>
      <p>Fill in the details and Joy will get started as soon as possible.</p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.group}>
          <label>Task Title *</label>
          <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Research top 10 competitors in my niche" required />
        </div>
        <div className={styles.row}>
          <div className={styles.group}>
            <label>Service Type</label>
            <select value={form.service_type} onChange={e => set('service_type', e.target.value)}>
              <option value="">Select a service...</option>
              {services.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className={styles.group}>
            <label>Priority</label>
            <select value={form.priority} onChange={e => set('priority', e.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className={styles.group}>
            <label>Due Date (optional)</label>
            <input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} />
          </div>
        </div>
        <div className={styles.group}>
          <label>Description *</label>
          <textarea rows={6} value={form.description} onChange={e => set('description', e.target.value)}
            placeholder="Describe the task in detail. The more information you provide, the better Joy can help you." required />
        </div>
        <button type="submit" className={styles.submit} disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Request →'}
        </button>
      </form>
    </div>
  )
}
