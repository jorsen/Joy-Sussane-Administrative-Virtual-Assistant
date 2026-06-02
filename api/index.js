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
    if (user.is_active === false) return res.status(403).json({ error: 'Account deactivated. Please contact support.' })
    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' })
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } })
  } catch (err) { res.status(500).json({ error: err.message }) }
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
      tasks = await sql`SELECT * FROM tasks WHERE client_id = ${req.user.id} ORDER BY created_at DESC`
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
    const appUrl = `https://${req.headers.host}`
    Promise.all([
      sendTaskEmails(task, req.user, appUrl),
      logActivity(task.id, req.user.name, 'task_created', `Task "${title}" was submitted`),
      notifyAdmin(task.id, `New task: ${title}`, `/admin/tasks/${task.id}`),
    ]).catch(e => console.error('Post-task hooks error:', e))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/tasks/export.ics', async (req, res) => {
  try {
    const token = req.query.token
    if (!token) return res.status(401).send('Unauthorized')
    let user
    try { user = jwt.verify(token, process.env.JWT_SECRET) } catch { return res.status(401).send('Invalid token') }
    const tasks = user.role === 'admin'
      ? await sql`SELECT * FROM tasks WHERE due_date IS NOT NULL ORDER BY due_date ASC`
      : await sql`SELECT * FROM tasks WHERE client_id = ${user.id} AND due_date IS NOT NULL ORDER BY due_date ASC`
    const toIcsDate = d => d.toISOString().replace(/-/g,'').split('T')[0]
    const lines = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Joy Sussane VA//EN', 'CALSCALE:GREGORIAN',
      ...tasks.flatMap(t => {
        const d = toIcsDate(new Date(t.due_date))
        return [
          'BEGIN:VEVENT',
          `UID:${t.id}@joysussaneva`,
          `SUMMARY:${t.title.replace(/\n/g,' ')}`,
          `DTSTART;VALUE=DATE:${d}`,
          `DTEND;VALUE=DATE:${d}`,
          t.description ? `DESCRIPTION:${t.description.replace(/\n/g,'\\n').slice(0,200)}` : '',
          'END:VEVENT',
        ].filter(Boolean)
      }),
      'END:VCALENDAR',
    ]
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="tasks.ics"')
    res.send(lines.join('\r\n'))
  } catch (err) { res.status(500).send(err.message) }
})

app.get('/api/tasks/:id', auth, async (req, res) => {
  try {
    const [task] = await sql`
      SELECT t.*, u.name as client_name FROM tasks t
      JOIN users u ON t.client_id = u.id WHERE t.id = ${req.params.id}
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
    const [old] = await sql`SELECT status, client_id FROM tasks WHERE id = ${req.params.id}`
    const [task] = await sql`
      UPDATE tasks SET
        status = COALESCE(${status}, status),
        priority = COALESCE(${priority}, priority),
        due_date = COALESCE(${due_date}, due_date),
        title = COALESCE(${title}, title),
        description = COALESCE(${description}, description),
        updated_at = NOW()
      WHERE id = ${req.params.id} RETURNING *
    `
    res.json(task)
    if (status && old && status !== old.status) {
      const label = status.replace('_', ' ')
      const appUrl = `https://${req.headers.host}`
      Promise.all([
        logActivity(task.id, req.user.name, 'status_changed', `Status changed from "${old.status.replace('_',' ')}" to "${label}"`),
        notifyUser(old.client_id, `Your task "${task.title}" is now ${label}`, `/portal/tasks/${task.id}`),
        sendStatusEmail(task, status, appUrl),
      ]).catch(e => console.error('Status change hooks error:', e))
    }
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
      WHERE m.task_id = ${req.params.id} ORDER BY m.created_at ASC
    `
    res.json(messages)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/tasks/:id/messages', auth, async (req, res) => {
  try {
    const [msg] = await sql`
      INSERT INTO messages (task_id, sender_id, content)
      VALUES (${req.params.id}, ${req.user.id}, ${req.body.content}) RETURNING *
    `
    const [sender] = await sql`SELECT name, role FROM users WHERE id = ${req.user.id}`
    res.status(201).json({ ...msg, sender_name: sender.name, sender_role: sender.role })
    const [task] = await sql`SELECT title, client_id FROM tasks WHERE id = ${req.params.id}`
    if (task) {
      const isAdmin = req.user.role === 'admin'
      Promise.all([
        logActivity(req.params.id, sender.name, 'message_sent', `${sender.name}: ${req.body.content.slice(0, 80)}`),
        isAdmin
          ? notifyUser(task.client_id, `New message on "${task.title}"`, `/portal/tasks/${req.params.id}`)
          : notifyAdmin(req.params.id, `${sender.name} replied on "${task.title}"`, `/admin/tasks/${req.params.id}`),
      ]).catch(e => console.error('Message hooks error:', e))
    }
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── FILES ─────────────────────────────────────────────
app.get('/api/tasks/:id/files', auth, async (req, res) => {
  try {
    const files = await sql`
      SELECT f.*, u.name as uploaded_by_name
      FROM files f JOIN users u ON f.uploaded_by = u.id
      WHERE f.task_id = ${req.params.id} ORDER BY f.created_at DESC
    `
    res.json(files)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/tasks/:id/files', auth, async (req, res) => {
  try {
    const { name, url, size } = req.body
    const [file] = await sql`
      INSERT INTO files (task_id, uploaded_by, name, url, size)
      VALUES (${req.params.id}, ${req.user.id}, ${name}, ${url}, ${size || null}) RETURNING *
    `
    res.status(201).json(file)
    logActivity(req.params.id, req.user.name, 'file_added', `"${name}" was uploaded`).catch(() => {})
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── NOTES (admin only) ────────────────────────────────
app.get('/api/tasks/:id/notes', auth, adminOnly, async (req, res) => {
  try {
    const notes = await sql`
      SELECT n.*, u.name as author_name FROM task_notes n
      JOIN users u ON n.author_id = u.id
      WHERE n.task_id = ${req.params.id} ORDER BY n.created_at ASC
    `
    res.json(notes)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/tasks/:id/notes', auth, adminOnly, async (req, res) => {
  try {
    const [note] = await sql`
      INSERT INTO task_notes (task_id, author_id, content)
      VALUES (${req.params.id}, ${req.user.id}, ${req.body.content}) RETURNING *
    `
    res.status(201).json({ ...note, author_name: req.user.name })
    logActivity(req.params.id, req.user.name, 'note_added', 'Admin added a private note').catch(() => {})
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.delete('/api/tasks/:taskId/notes/:noteId', auth, adminOnly, async (req, res) => {
  await sql`DELETE FROM task_notes WHERE id = ${req.params.noteId} AND task_id = ${req.params.taskId}`
  res.json({ success: true })
})

// ── ACTIVITY LOG ──────────────────────────────────────
app.get('/api/tasks/:id/activity', auth, async (req, res) => {
  try {
    const activity = await sql`
      SELECT * FROM activity_log WHERE task_id = ${req.params.id} ORDER BY created_at ASC
    `
    res.json(activity)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── NOTIFICATIONS ─────────────────────────────────────
app.get('/api/notifications', auth, async (req, res) => {
  try {
    const notifs = await sql`
      SELECT * FROM notifications WHERE user_id = ${req.user.id}
      ORDER BY created_at DESC LIMIT 50
    `
    res.json(notifs)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.patch('/api/notifications/read-all', auth, async (req, res) => {
  try {
    await sql`UPDATE notifications SET is_read = TRUE WHERE user_id = ${req.user.id}`
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.patch('/api/notifications/:id/read', auth, async (req, res) => {
  try {
    await sql`UPDATE notifications SET is_read = TRUE WHERE id = ${req.params.id} AND user_id = ${req.user.id}`
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── SEARCH ────────────────────────────────────────────
app.get('/api/search', auth, async (req, res) => {
  try {
    const q = `%${req.query.q || ''}%`
    let results
    if (req.user.role === 'admin') {
      results = await sql`
        SELECT t.id, t.title, t.status, t.service_type, t.priority, t.created_at, u.name as client_name
        FROM tasks t JOIN users u ON t.client_id = u.id
        WHERE t.title ILIKE ${q} OR t.description ILIKE ${q}
        ORDER BY t.created_at DESC LIMIT 20
      `
    } else {
      results = await sql`
        SELECT id, title, status, service_type, priority, created_at
        FROM tasks WHERE client_id = ${req.user.id} AND (title ILIKE ${q} OR description ILIKE ${q})
        ORDER BY created_at DESC LIMIT 20
      `
    }
    res.json(results)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── ADMIN: Clients ─────────────────────────────────────
app.get('/api/admin/clients', auth, adminOnly, async (req, res) => {
  try {
    const clients = await sql`
      SELECT u.id, u.name, u.email, u.company, u.created_at, u.is_active,
        COUNT(t.id) as task_count,
        SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_count
      FROM users u LEFT JOIN tasks t ON t.client_id = u.id
      WHERE u.role = 'client' GROUP BY u.id ORDER BY u.created_at DESC
    `
    res.json(clients)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.patch('/api/admin/clients/:id/status', auth, adminOnly, async (req, res) => {
  try {
    const { is_active } = req.body
    const [user] = await sql`
      UPDATE users SET is_active = ${is_active} WHERE id = ${req.params.id} AND role = 'client'
      RETURNING id, name, email, is_active
    `
    if (!user) return res.status(404).json({ error: 'Client not found' })
    res.json(user)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.delete('/api/admin/clients/:id', auth, adminOnly, async (req, res) => {
  try {
    const [user] = await sql`SELECT id FROM users WHERE id = ${req.params.id} AND role = 'client'`
    if (!user) return res.status(404).json({ error: 'Client not found' })
    await sql`DELETE FROM users WHERE id = ${req.params.id}`
    res.json({ success: true })
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

// ── ADMIN: Analytics ──────────────────────────────────
app.get('/api/admin/analytics', auth, adminOnly, async (req, res) => {
  try {
    const [monthly, services, totals] = await Promise.all([
      sql`
        SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') as month,
               COUNT(*) FILTER (WHERE status = 'completed') as completed,
               COUNT(*) as total
        FROM tasks
        WHERE created_at >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY DATE_TRUNC('month', created_at) ASC
      `,
      sql`
        SELECT COALESCE(service_type, 'General') as service_type, COUNT(*) as count
        FROM tasks GROUP BY service_type ORDER BY count DESC LIMIT 6
      `,
      sql`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'pending') as pending,
          COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
          COUNT(*) FILTER (WHERE status = 'completed') as completed,
          COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled
        FROM tasks
      `,
    ])
    res.json({ monthly, services, totals: totals[0] })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── INVOICES ──────────────────────────────────────────
app.get('/api/invoices', auth, async (req, res) => {
  try {
    let invoices
    if (req.user.role === 'admin') {
      invoices = await sql`
        SELECT i.*, u.name as client_name, u.email as client_email
        FROM invoices i JOIN users u ON i.client_id = u.id
        ORDER BY i.created_at DESC
      `
    } else {
      invoices = await sql`SELECT * FROM invoices WHERE client_id = ${req.user.id} ORDER BY created_at DESC`
    }
    res.json(invoices)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/invoices', auth, adminOnly, async (req, res) => {
  try {
    const { client_id, title, amount, status, due_date, notes } = req.body
    const [invoice] = await sql`
      INSERT INTO invoices (client_id, title, amount, status, due_date, notes)
      VALUES (${client_id}, ${title}, ${amount}, ${status || 'draft'}, ${due_date || null}, ${notes || null})
      RETURNING *
    `
    res.status(201).json(invoice)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.patch('/api/invoices/:id', auth, adminOnly, async (req, res) => {
  try {
    const { title, amount, status, due_date, notes } = req.body
    const [invoice] = await sql`
      UPDATE invoices SET
        title = COALESCE(${title}, title),
        amount = COALESCE(${amount}, amount),
        status = COALESCE(${status}, status),
        due_date = COALESCE(${due_date}, due_date),
        notes = COALESCE(${notes}, notes),
        updated_at = NOW()
      WHERE id = ${req.params.id} RETURNING *
    `
    res.json(invoice)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.delete('/api/invoices/:id', auth, adminOnly, async (req, res) => {
  await sql`DELETE FROM invoices WHERE id = ${req.params.id}`
  res.json({ success: true })
})

// ── HELPERS ───────────────────────────────────────────
async function logActivity(taskId, actorName, action, detail) {
  try {
    await sql`INSERT INTO activity_log (task_id, actor_name, action, detail) VALUES (${taskId}, ${actorName}, ${action}, ${detail})`
  } catch (e) { console.error('Activity log error:', e.message) }
}

async function notifyUser(userId, title, link) {
  try {
    await sql`INSERT INTO notifications (user_id, title, link) VALUES (${userId}, ${title}, ${link})`
  } catch (e) { console.error('Notify error:', e.message) }
}

async function notifyAdmin(taskId, title, link) {
  try {
    const [admin] = await sql`SELECT id FROM users WHERE role = 'admin' LIMIT 1`
    if (admin) await notifyUser(admin.id, title, link)
  } catch (e) { console.error('Notify admin error:', e.message) }
}

async function sendTaskEmails(task, client, appUrl) {
  if (!resend) return
  const from = process.env.RESEND_FROM_EMAIL || 'Joy Sussane VA <onboarding@resend.dev>'
  const [admin] = await sql`SELECT email FROM users WHERE role = 'admin' LIMIT 1`
  const details = emailDetailsHtml(task)
  await Promise.all([
    resend.emails.send({
      from, to: client.email,
      subject: `Request Received: ${task.title}`,
      html: emailWrap(`<h1 style="color:#6d28d9">Request Received ✓</h1><p>Hi ${client.name}, your request has been received. Joy will get started soon.</p><div style="background:#f8f7ff;border-radius:12px;padding:20px 24px;margin:24px 0"><h2>${task.title}</h2>${details}</div><a href="${appUrl}/portal/tasks/${task.id}" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#6d28d9,#7c3aed);color:#fff;border-radius:10px;font-weight:600;text-decoration:none">View Request →</a>`),
    }),
    resend.emails.send({
      from, to: admin.email,
      subject: `New Task: ${task.title}`,
      html: emailWrap(`<h1 style="color:#6d28d9">New Task Submitted</h1><p>By <strong>${client.name}</strong> (${client.email})</p><div style="background:#f8f7ff;border-radius:12px;padding:20px 24px;margin:24px 0"><h2>${task.title}</h2>${details}</div><a href="${appUrl}/admin/tasks/${task.id}" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#6d28d9,#7c3aed);color:#fff;border-radius:10px;font-weight:600;text-decoration:none">View Task →</a>`),
    }),
  ])
}

async function sendStatusEmail(task, newStatus, appUrl) {
  if (!resend) return
  const from = process.env.RESEND_FROM_EMAIL || 'Joy Sussane VA <onboarding@resend.dev>'
  if (newStatus !== 'in_progress' && newStatus !== 'completed') return
  const [client] = await sql`SELECT name, email FROM users WHERE id = ${task.client_id}`
  if (!client) return
  const label = newStatus === 'in_progress' ? 'In Progress 🚀' : 'Completed ✅'
  const msg = newStatus === 'in_progress'
    ? `Joy has started working on your request and will keep you updated.`
    : `Joy has completed your request. Check the task for any deliverables or notes.`
  await resend.emails.send({
    from, to: client.email,
    subject: `Task Update: "${task.title}" is now ${newStatus === 'in_progress' ? 'In Progress' : 'Completed'}`,
    html: emailWrap(`<h1 style="color:#6d28d9">Task Status Update</h1><p>Hi ${client.name},</p><p>${msg}</p><div style="background:#f8f7ff;border-radius:12px;padding:20px 24px;margin:24px 0"><h2>${task.title}</h2><p style="color:#6d28d9;font-weight:700;font-size:16px">${label}</p></div><a href="${appUrl}/portal/tasks/${task.id}" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#6d28d9,#7c3aed);color:#fff;border-radius:10px;font-weight:600;text-decoration:none">View Task →</a>`),
  })
}

function emailDetailsHtml(task) {
  return `<table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px">
    <tr><td style="padding:6px 0;color:#6b7280;width:100px">Service</td><td style="font-weight:600">${task.service_type || '—'}</td></tr>
    <tr><td style="padding:6px 0;color:#6b7280">Priority</td><td style="font-weight:600;text-transform:capitalize">${task.priority}</td></tr>
    <tr><td style="padding:6px 0;color:#6b7280">Due Date</td><td style="font-weight:600">${task.due_date ? new Date(task.due_date).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'}) : 'Not specified'}</td></tr>
  </table>${task.description ? `<p style="font-size:14px;color:#374151;background:#fff;padding:12px;border-radius:8px;border:1px solid #e5e7eb">${task.description}</p>` : ''}`
}

function emailWrap(content) {
  return `<div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:40px 24px;color:#0f0a1e">${content}<p style="font-size:12px;color:#9ca3af;margin-top:32px">Joy Sussane Administrative Virtual Assistant</p></div>`
}

export default app
