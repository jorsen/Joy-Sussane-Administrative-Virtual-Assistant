import { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { api } from './api'
import { StatusBadge, PriorityBadge } from './Badges'
import styles from './TaskDetail.module.css'

export default function TaskDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [task, setTask] = useState(null)
  const [messages, setMessages] = useState([])
  const [files, setFiles] = useState([])
  const [msgText, setMsgText] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [fileName, setFileName] = useState('')
  const [loading, setLoading] = useState(true)
  const msgEnd = useRef(null)

  useEffect(() => {
    Promise.all([api.getTask(id), api.getMessages(id), api.getFiles(id)])
      .then(([t, m, f]) => { setTask(t); setMessages(m); setFiles(f) })
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => { msgEnd.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function sendMsg(e) {
    e.preventDefault()
    if (!msgText.trim()) return
    const msg = await api.sendMessage(id, msgText)
    setMessages(m => [...m, msg])
    setMsgText('')
  }

  async function addFile(e) {
    e.preventDefault()
    if (!fileUrl || !fileName) return
    const file = await api.addFile(id, { name: fileName, url: fileUrl })
    setFiles(f => [...f, file])
    setFileUrl(''); setFileName('')
  }

  async function updateStatus(status) {
    const updated = await api.updateTask(id, { status })
    setTask(updated)
  }

  if (loading) return <div className={styles.loading}>Loading task...</div>
  if (!task) return <div className={styles.loading}>Task not found.</div>

  return (
    <div className={styles.page}>
      <Link to={user?.role === 'admin' ? '/admin/tasks' : '/portal/tasks'} className={styles.back}>← Back to tasks</Link>

      <div className={styles.top}>
        <div>
          <h1>{task.title}</h1>
          <div className={styles.meta}>
            <StatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
            {task.service_type && <span className={styles.serviceTag}>{task.service_type}</span>}
            {task.client_name && <span className={styles.client}>👤 {task.client_name}</span>}
          </div>
        </div>
        {user?.role === 'admin' && (
          <div className={styles.statusControls}>
            {['pending','in_progress','completed','cancelled'].map(s => (
              <button key={s} onClick={() => updateStatus(s)}
                className={`${styles.statusBtn} ${task.status === s ? styles.activeStatus : ''}`}>
                {s.replace('_',' ')}
              </button>
            ))}
          </div>
        )}
      </div>

      {task.description && <p className={styles.desc}>{task.description}</p>}

      <div className={styles.grid}>
        {/* Messages */}
        <div className={styles.card}>
          <h3>💬 Messages</h3>
          <div className={styles.messages}>
            {messages.length === 0 && <p className={styles.empty}>No messages yet. Start the conversation!</p>}
            {messages.map(m => (
              <div key={m.id} className={`${styles.msg} ${m.sender_id === user?.id ? styles.mine : ''}`}>
                <div className={styles.msgBubble}>{m.content}</div>
                <div className={styles.msgMeta}>{m.sender_name} · {new Date(m.created_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</div>
              </div>
            ))}
            <div ref={msgEnd} />
          </div>
          <form onSubmit={sendMsg} className={styles.msgForm}>
            <input value={msgText} onChange={e => setMsgText(e.target.value)} placeholder="Type a message..." required />
            <button type="submit">Send</button>
          </form>
        </div>

        {/* Files */}
        <div className={styles.card}>
          <h3>📁 Files & Deliverables</h3>
          {files.length === 0 && <p className={styles.empty}>No files yet.</p>}
          <div className={styles.fileList}>
            {files.map(f => (
              <a key={f.id} href={f.url} target="_blank" rel="noopener" className={styles.fileItem}>
                <span>📄</span>
                <div><strong>{f.name}</strong><span>{f.uploaded_by_name} · {new Date(f.created_at).toLocaleDateString()}</span></div>
              </a>
            ))}
          </div>
          {user?.role === 'admin' && (
            <form onSubmit={addFile} className={styles.fileForm}>
              <input value={fileName} onChange={e => setFileName(e.target.value)} placeholder="File name (e.g. Report.pdf)" required />
              <input value={fileUrl} onChange={e => setFileUrl(e.target.value)} placeholder="File URL (Google Drive, Dropbox, etc.)" required />
              <button type="submit">Add File</button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
