import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { put } from '@vercel/blob'
import { Resend } from 'resend'
import sql from './db.js'
import { auth, adminOnly } from './middleware.js'

const app = express()
app.use(cors())
app.use(express.json())

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

// ── FILE UPLOAD ────────────────────────────────────────
// Body is the raw file (not multipart). express.json() skips non-JSON content types
// so the stream is intact here.
app.post('/api/upload', auth, async (req, res) => {
  try {
    const filename = req.query.filename || 'upload'
    const size = req.headers['content-length']
    const blob = await put(`tasks/${filename}`, req, {
      access: 'public',
      contentType: req.headers['content-type'] || 'application/octet-stream',
    })
    res.json({ url: blob.url, name: filename, size: size || null })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── AUTH ──────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const [user] = await sql`SELECT * FROM users WHERE email = ${email}`
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, company } = req.body
    const hash = await bcrypt.hash(password, 10)
    const [user] = await sql`
      INSERT INTO users (name, email, password_hash, role, company)
      VALUES (${name}, ${email}, ${hash}, 'client', ${company || null})
      RETURNING id, name, email, role
    `
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )
    res.status(201).json({ token, user })
  } catch (err) {
    if (err.message.includes('unique')) return res.status(409).json({ error: 'Email already exists' })
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/auth/me', auth, async (req, res) => {
  const [user] = await sql`SELECT id, name, email, role, company FROM users WHERE id = ${req.user.id}`
  res.json(user)
})

// ── TASKS ─────────────────────────────────────────────
app.get('/api/tasks', auth, async (req, res) => {
  try {
    let tasks
    if (req.user.role === 'admin') {
      tasks = await sql`
        SELECT t.*, u.name as client_name, u.email as client_email
        FROM tasks t JOIN users u ON t.client_id = u.id
        ORDER BY t.created_at DESC
      `
    } else {
      tasks = await sql`
        SELECT * FROM tasks WHERE client_id = ${req.user.id}
        ORDER BY created_at DESC
      `
    }
    res.json(tasks)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/tasks', auth, async (req, res) => {
  try {
    const { title, description, service_type, priority, due_date } = req.body
    const [task] = await sql`
      INSERT INTO tasks (client_id, title, description, service_type, priority, due_date)
      VALUES (${req.user.id}, ${title}, ${description}, ${service_type}, ${priority || 'medium'}, ${due_date || null})
      RETURNING *
    `
    res.status(201).json(task)

    // Fire-and-forget: send email notifications without blocking the response
    const appUrl = `https://${req.headers.host}`
    sendTaskEmails(task, req.user, appUrl).catch(err => console.error('Email error:', err))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/tasks/:id', auth, async (req, res) => {
  try {
    const [task] = await sql`
      SELECT t.*, u.name as client_name FROM tasks t
      JOIN users u ON t.client_id = u.id
      WHERE t.id = ${req.params.id}
    `
    if (!task) return res.status(404).json({ error: 'Task not found' })
    if (req.user.role !== 'admin' && task.client_id !== req.user.id)
      return res.status(403).json({ error: 'Forbidden' })
    res.json(task)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.patch('/api/tasks/:id', auth, async (req, res) => {
  try {
    const { status, priority, due_date, title, description } = req.body
    const [task] = await sql`
      UPDATE tasks SET
        status = COALESCE(${status}, status),
        priority = COALESCE(${priority}, priority),
        due_date = COALESCE(${due_date}, due_date),
        title = COALESCE(${title}, title),
        description = COALESCE(${description}, description),
        updated_at = NOW()
      WHERE id = ${req.params.id}
      RETURNING *
    `
    res.json(task)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.delete('/api/tasks/:id', auth, adminOnly, async (req, res) => {
  await sql`DELETE FROM tasks WHERE id = ${req.params.id}`
  res.json({ success: true })
})

// ── MESSAGES ──────────────────────────────────────────
app.get('/api/tasks/:id/messages', auth, async (req, res) => {
  try {
    const messages = await sql`
      SELECT m.*, u.name as sender_name, u.role as sender_role
      FROM messages m JOIN users u ON m.sender_id = u.id
      WHERE m.task_id = ${req.params.id}
      ORDER BY m.created_at ASC
    `
    res.json(messages)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/tasks/:id/messages', auth, async (req, res) => {
  try {
    const [msg] = await sql`
      INSERT INTO messages (task_id, sender_id, content)
      VALUES (${req.params.id}, ${req.user.id}, ${req.body.content})
      RETURNING *
    `
    const [sender] = await sql`SELECT name, role FROM users WHERE id = ${req.user.id}`
    res.status(201).json({ ...msg, sender_name: sender.name, sender_role: sender.role })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── FILES ─────────────────────────────────────────────
app.get('/api/tasks/:id/files', auth, async (req, res) => {
  try {
    const files = await sql`
      SELECT f.*, u.name as uploaded_by_name
      FROM files f JOIN users u ON f.uploaded_by = u.id
      WHERE f.task_id = ${req.params.id}
      ORDER BY f.created_at DESC
    `
    res.json(files)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/tasks/:id/files', auth, async (req, res) => {
  try {
    const { name, url, size } = req.body
    const [file] = await sql`
      INSERT INTO files (task_id, uploaded_by, name, url, size)
      VALUES (${req.params.id}, ${req.user.id}, ${name}, ${url}, ${size || null})
      RETURNING *
    `
    res.status(201).json(file)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── ADMIN: Clients ─────────────────────────────────────
app.get('/api/admin/clients', auth, adminOnly, async (req, res) => {
  try {
    const clients = await sql`
      SELECT u.id, u.name, u.email, u.company, u.created_at,
        COUNT(t.id) as task_count,
        SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_count
      FROM users u
      LEFT JOIN tasks t ON t.client_id = u.id
      WHERE u.role = 'client'
      GROUP BY u.id ORDER BY u.created_at DESC
    `
    res.json(clients)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── ADMIN: Stats ───────────────────────────────────────
app.get('/api/admin/stats', auth, adminOnly, async (req, res) => {
  try {
    const [stats] = await sql`
      SELECT
        COUNT(DISTINCT CASE WHEN role = 'client' THEN id END) as total_clients,
        (SELECT COUNT(*) FROM tasks) as total_tasks,
        (SELECT COUNT(*) FROM tasks WHERE status = 'pending') as pending_tasks,
        (SELECT COUNT(*) FROM tasks WHERE status = 'in_progress') as active_tasks,
        (SELECT COUNT(*) FROM tasks WHERE status = 'completed') as completed_tasks
      FROM users
    `
    res.json(stats)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── EMAIL HELPERS ─────────────────────────────────────
async function sendTaskEmails(task, client, appUrl) {
  if (!resend) return
  const from = process.env.RESEND_FROM_EMAIL || 'Joy Sussane VA <onboarding@resend.dev>'
  const [admin] = await sql`SELECT email FROM users WHERE role = 'admin' LIMIT 1`

  const details = `
    <table style="width:100%;border-collapse:collapse;margin:20px 0;">
      <tr><td style="padding:8px 0;color:#6b7280;font-size:14px;width:120px;">Service</td><td style="padding:8px 0;font-size:14px;font-weight:600;">${task.service_type || '—'}</td></tr>
      <tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Priority</td><td style="padding:8px 0;font-size:14px;font-weight:600;text-transform:capitalize;">${task.priority}</td></tr>
      <tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Due Date</td><td style="padding:8px 0;font-size:14px;font-weight:600;">${task.due_date ? new Date(task.due_date).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' }) : 'Not specified'}</td></tr>
    </table>
    ${task.description ? `<p style="font-size:14px;color:#374151;background:#f8f7ff;padding:16px;border-radius:10px;margin:16px 0;">${task.description}</p>` : ''}
  `

  await Promise.all([
    resend.emails.send({
      from,
      to: client.email,
      subject: `Request Received: ${task.title}`,
      html: `
        <div style="font-family:Inter,sans-serif;max-width:580px;margin:0 auto;padding:40px 24px;color:#0f0a1e;">
          <h1 style="font-size:22px;font-weight:800;color:#6d28d9;margin-bottom:8px;">Request Received ✓</h1>
          <p style="font-size:15px;color:#374151;">Hi ${client.name},</p>
          <p style="font-size:15px;color:#374151;">Your request has been received. Joy will review it and get started as soon as possible.</p>
          <div style="background:#f8f7ff;border-radius:12px;padding:20px 24px;margin:24px 0;">
            <h2 style="font-size:17px;font-weight:700;margin:0 0 4px;">${task.title}</h2>
            ${details}
          </div>
          <a href="${appUrl}/portal/tasks/${task.id}" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#6d28d9,#7c3aed);color:#fff;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px;">View Your Request →</a>
          <p style="font-size:13px;color:#9ca3af;margin-top:32px;">Joy Sussane Administrative Virtual Assistant</p>
        </div>
      `,
    }),
    resend.emails.send({
      from,
      to: admin.email,
      subject: `New Task: ${task.title}`,
      html: `
        <div style="font-family:Inter,sans-serif;max-width:580px;margin:0 auto;padding:40px 24px;color:#0f0a1e;">
          <h1 style="font-size:22px;font-weight:800;color:#6d28d9;margin-bottom:8px;">New Task Submitted</h1>
          <p style="font-size:15px;color:#374151;">A new request has been submitted by <strong>${client.name}</strong> (${client.email}).</p>
          <div style="background:#f8f7ff;border-radius:12px;padding:20px 24px;margin:24px 0;">
            <h2 style="font-size:17px;font-weight:700;margin:0 0 4px;">${task.title}</h2>
            ${details}
          </div>
          <a href="${appUrl}/admin/tasks/${task.id}" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#6d28d9,#7c3aed);color:#fff;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px;">View Task →</a>
        </div>
      `,
    }),
  ])
}

export default app
