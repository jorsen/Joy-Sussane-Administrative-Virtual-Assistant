import { useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import { api } from './api'
import styles from './Invoices.module.css'

function formatMoney(amount) {
  return '$' + Number(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

const STATUS_META = {
  draft:   { label: 'Draft',   cls: 'statusDraft'   },
  sent:    { label: 'Sent',    cls: 'statusSent'    },
  paid:    { label: 'Paid',    cls: 'statusPaid'    },
  overdue: { label: 'Overdue', cls: 'statusOverdue' },
}

const EMPTY_FORM = {
  title: '',
  client_id: '',
  amount: '',
  status: 'draft',
  due_date: '',
  notes: '',
}

function InvoiceForm({ invoice, clients, onSave, onCancel }) {
  const [form, setForm] = useState(
    invoice
      ? {
          title:     invoice.title     ?? '',
          client_id: invoice.client_id ?? '',
          amount:    invoice.amount    ?? '',
          status:    invoice.status    ?? 'draft',
          due_date:  invoice.due_date  ? invoice.due_date.substring(0, 10) : '',
          notes:     invoice.notes     ?? '',
        }
      : { ...EMPTY_FORM }
  )
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...form,
        amount: parseFloat(form.amount),
        due_date: form.due_date || null,
        notes: form.notes || null,
      }
      const result = invoice
        ? await api.updateInvoice(invoice.id, payload)
        : await api.createInvoice(payload)
      onSave(result, !!invoice)
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>{invoice ? 'Edit Invoice' : 'New Invoice'}</h2>
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.formGroup}>
            <label htmlFor="inv-title">Title</label>
            <input
              id="inv-title"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="e.g. Monthly Retainer – June"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="inv-client">Client</label>
            <select
              id="inv-client"
              value={form.client_id}
              onChange={e => set('client_id', e.target.value)}
              required
            >
              <option value="">Select a client…</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.email}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="inv-amount">Amount (USD)</label>
              <input
                id="inv-amount"
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={e => set('amount', e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="inv-status">Status</label>
              <select
                id="inv-status"
                value={form.status}
                onChange={e => set('status', e.target.value)}
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="inv-due">Due Date</label>
            <input
              id="inv-due"
              type="date"
              value={form.due_date}
              onChange={e => set('due_date', e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="inv-notes">Notes <span className={styles.optional}>(optional)</span></label>
            <textarea
              id="inv-notes"
              rows={3}
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Any additional details…"
            />
          </div>

          <div className={styles.modalActions}>
            <button type="button" className={styles.cancelBtn} onClick={onCancel} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className={styles.saveBtn} disabled={saving}>
              {saving ? 'Saving…' : invoice ? 'Save Changes' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Invoices() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [invoices, setInvoices]           = useState([])
  const [loading, setLoading]             = useState(true)
  const [showForm, setShowForm]           = useState(false)
  const [editingInvoice, setEditingInvoice] = useState(null)
  const [clients, setClients]             = useState([])
  const [filter, setFilter]               = useState('all') // 'all' | 'unpaid' | 'paid'

  useEffect(() => {
    const fetches = [api.getInvoices()]
    if (isAdmin) fetches.push(api.getClients())
    Promise.all(fetches)
      .then(([inv, cls]) => {
        setInvoices(inv)
        if (cls) setClients(cls)
      })
      .catch(err => alert(err.message))
      .finally(() => setLoading(false))
  }, [isAdmin])

  const filtered = invoices.filter(inv => {
    if (filter === 'paid')   return inv.status === 'paid'
    if (filter === 'unpaid') return inv.status !== 'paid'
    return true
  })

  const outstanding = invoices
    .filter(inv => inv.status !== 'paid')
    .reduce((sum, inv) => sum + Number(inv.amount), 0)

  function openNew() {
    setEditingInvoice(null)
    setShowForm(true)
  }

  function openEdit(inv) {
    setEditingInvoice(inv)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingInvoice(null)
  }

  function handleSaved(result, wasEdit) {
    if (wasEdit) {
      setInvoices(prev => prev.map(inv => inv.id === result.id ? result : inv))
    } else {
      setInvoices(prev => [result, ...prev])
    }
    closeForm()
  }

  async function handleMarkPaid(inv) {
    try {
      const updated = await api.updateInvoice(inv.id, { ...inv, status: 'paid' })
      setInvoices(prev => prev.map(i => i.id === updated.id ? updated : i))
    } catch (err) {
      alert(err.message)
    }
  }

  async function handleDelete(inv) {
    if (!window.confirm(`Delete invoice "${inv.title}"? This cannot be undone.`)) return
    try {
      await api.deleteInvoice(inv.id)
      setInvoices(prev => prev.filter(i => i.id !== inv.id))
    } catch (err) {
      alert(err.message)
    }
  }

  if (loading) return <p className={styles.loading}>Loading…</p>

  return (
    <div className={styles.page}>
      {showForm && (
        <InvoiceForm
          invoice={editingInvoice}
          clients={clients}
          onSave={handleSaved}
          onCancel={closeForm}
        />
      )}

      <div className={styles.pageHeader}>
        <div>
          <h1>Invoices</h1>
          <p>
            {outstanding > 0
              ? <>{formatMoney(outstanding)} outstanding across {invoices.filter(i => i.status !== 'paid').length} invoice{invoices.filter(i => i.status !== 'paid').length !== 1 ? 's' : ''}</>
              : 'All invoices are settled.'
            }
          </p>
        </div>
        {isAdmin && (
          <button className={styles.newBtn} onClick={openNew}>
            + New Invoice
          </button>
        )}
      </div>

      <div className={styles.toolbar}>
        <div className={styles.filters}>
          {[['all', 'All'], ['unpaid', 'Unpaid'], ['paid', 'Paid']].map(([key, label]) => (
            <button
              key={key}
              className={`${styles.filter} ${filter === key ? styles.filterActive : ''}`}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <span className={styles.count}>
          {filtered.length} invoice{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <span>🧾</span>
          <p>{filter === 'paid' ? 'No paid invoices yet.' : filter === 'unpaid' ? 'No unpaid invoices.' : 'No invoices yet.'}</p>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                {isAdmin ? <th>Client</th> : <th>Title</th>}
                {isAdmin && <th>Title</th>}
                <th>Amount</th>
                <th>Status</th>
                <th>Due Date</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map(inv => {
                const meta = STATUS_META[inv.status] ?? STATUS_META.draft
                return (
                  <tr key={inv.id}>
                    {isAdmin ? (
                      <td>
                        <div className={styles.clientCell}>
                          <div className={styles.clientAvatar}>
                            {inv.client_name?.[0]?.toUpperCase() ?? '?'}
                          </div>
                          <span className={styles.clientName}>{inv.client_name}</span>
                        </div>
                      </td>
                    ) : null}
                    <td className={styles.titleCell}>{inv.title}</td>
                    <td className={styles.amount}>{formatMoney(inv.amount)}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[meta.cls]}`}>
                        {meta.label}
                      </span>
                    </td>
                    <td className={styles.dueDate}>{formatDate(inv.due_date)}</td>
                    {isAdmin && (
                      <td>
                        <div className={styles.actions}>
                          <button
                            className={styles.iconBtn}
                            title="Edit invoice"
                            onClick={() => openEdit(inv)}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </button>
                          {inv.status !== 'paid' && (
                            <button
                              className={`${styles.iconBtn} ${styles.iconBtnGreen}`}
                              title="Mark as paid"
                              onClick={() => handleMarkPaid(inv)}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                            </button>
                          )}
                          <button
                            className={`${styles.iconBtn} ${styles.iconBtnRed}`}
                            title="Delete invoice"
                            onClick={() => handleDelete(inv)}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                              <path d="M10 11v6M14 11v6"/>
                              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
