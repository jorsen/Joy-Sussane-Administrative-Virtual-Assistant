import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from './api'
import styles from './NewTask.module.css'

const services = ['Web Research','Social Media Management','Website Management','Admin & Data Entry','Email & Calendar Support','Payment & Records Tracking','Other']

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fileIcon(name) {
  const ext = name.split('.').pop().toLowerCase()
  if (['jpg','jpeg','png','gif','webp','svg'].includes(ext)) return '🖼️'
  if (ext === 'pdf') return '📄'
  if (['doc','docx'].includes(ext)) return '📝'
  if (['xls','xlsx','csv'].includes(ext)) return '📊'
  if (['zip','rar','7z'].includes(ext)) return '🗜️'
  return '📎'
}

export default function NewTask() {
  const [form, setForm] = useState({ title: '', description: '', service_type: '', priority: 'medium', due_date: '' })
  const [selectedFiles, setSelectedFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const task = await api.createTask(form)

      if (selectedFiles.length > 0) {
        setUploadProgress(`Uploading ${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''}…`)
        await Promise.all(
          selectedFiles.map(async (file) => {
            const uploaded = await api.uploadFile(file)
            await api.addFile(task.id, { name: uploaded.name, url: uploaded.url, size: uploaded.size })
          })
        )
      }

      navigate(`/portal/tasks/${task.id}`)
    } catch (err) {
      alert(err.message)
      setLoading(false)
      setUploadProgress('')
    }
  }

  function addFiles(fileList) {
    const incoming = Array.from(fileList)
    setSelectedFiles(prev => {
      const names = new Set(prev.map(f => f.name))
      return [...prev, ...incoming.filter(f => !names.has(f.name))]
    })
  }

  function onDrop(e) {
    e.preventDefault()
    setDragOver(false)
    addFiles(e.dataTransfer.files)
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

        <div className={styles.group}>
          <label>Attachments (optional)</label>
          <div
            className={`${styles.dropzone} ${dragOver ? styles.dragOver : ''}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <span className={styles.dropIcon}>📎</span>
            <span className={styles.dropText}>Drag & drop files here, or <u>browse</u></span>
            <span className={styles.dropHint}>PDF, Word, Excel, images — max 4 MB each</span>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className={styles.hiddenInput}
              onChange={e => { addFiles(e.target.files); e.target.value = '' }}
            />
          </div>

          {selectedFiles.length > 0 && (
            <ul className={styles.fileList}>
              {selectedFiles.map(f => (
                <li key={f.name} className={styles.fileItem}>
                  <span className={styles.fileIcon}>{fileIcon(f.name)}</span>
                  <span className={styles.fileName}>{f.name}</span>
                  <span className={styles.fileSize}>{formatSize(f.size)}</span>
                  <button type="button" className={styles.fileRemove} onClick={() => removeFile(f.name)}>✕</button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button type="submit" className={styles.submit} disabled={loading}>
          {loading ? (uploadProgress || 'Submitting…') : 'Submit Request →'}
        </button>
      </form>
    </div>
  )

  function removeFile(name) {
    setSelectedFiles(prev => prev.filter(f => f.name !== name))
  }
}
