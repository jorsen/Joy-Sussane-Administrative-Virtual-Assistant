import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from './api'
import styles from './ClientList.module.css'

function ConfirmModal({ client, action, onConfirm, onCancel }) {
  const isDelete = action === 'delete'
  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={`${styles.modalIcon} ${isDelete ? styles.modalIconRed : styles.modalIconOrange}`}>
          {isDelete ? '🗑️' : '🚫'}
        </div>
        <h3>{isDelete ? 'Delete Client' : 'Deactivate Client'}</h3>
        <p>
          {isDelete
            ? <><strong>{client.name}</strong> and all their tasks, messages, and files will be permanently deleted. This cannot be undone.</>
            : <><strong>{client.name}</strong> will no longer be able to log in. Their data is preserved and you can reactivate them anytime.</>
          }
        </p>
        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onCancel}>Cancel</button>
          <button
            className={`${styles.confirmBtn} ${isDelete ? styles.confirmRed : styles.confirmOrange}`}
            onClick={onConfirm}
          >
            {isDelete ? 'Yes, Delete Permanently' : 'Yes, Deactivate'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ClientList() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('all')
  const [confirm, setConfirm] = useState(null)
  const [working, setWorking] = useState(null)

  useEffect(() => { api.getClients().then(setClients).finally(() => setLoading(false)) }, [])

  const filtered = clients.filter(c => {
    const matchSearch = !search ||
      [c.name, c.email, c.company].some(f => f?.toLowerCase().includes(search.toLowerCase()))
    const matchTab = tab === 'all'
      || (tab === 'active' ? c.is_active !== false : c.is_active === false)
    return matchSearch && matchTab
  })

  const counts = {
    all: clients.length,
    active: clients.filter(c => c.is_active !== false).length,
    inactive: clients.filter(c => c.is_active === false).length,
  }

  async function handleDeactivate(client) {
    setWorking(client.id); setConfirm(null)
    try {
      await api.setClientStatus(client.id, false)
      setClients(cs => cs.map(c => c.id === client.id ? { ...c, is_active: false } : c))
    } catch (err) { alert(err.message) }
    setWorking(null)
  }

  async function handleReactivate(client) {
    setWorking(client.id)
    try {
      await api.setClientStatus(client.id, true)
      setClients(cs => cs.map(c => c.id === client.id ? { ...c, is_active: true } : c))
    } catch (err) { alert(err.message) }
    setWorking(null)
  }

  async function handleDelete(client) {
    setWorking(client.id); setConfirm(null)
    try {
      await api.deleteClient(client.id)
      setClients(cs => cs.filter(c => c.id !== client.id))
    } catch (err) { alert(err.message) }
    setWorking(null)
  }

  return (
    <div className={styles.page}>
      {confirm && (
        <ConfirmModal
          client={confirm.client}
          action={confirm.action}
          onConfirm={() =>
            confirm.action === 'delete'
              ? handleDelete(confirm.client)
              : handleDeactivate(confirm.client)
          }
          onCancel={() => setConfirm(null)}
        />
      )}

      <div className={styles.pageHeader}>
        <div>
          <h1>Clients</h1>
          <p>{counts.active} active · {counts.inactive} inactive</p>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.tabs}>
          {[['all', 'All'], ['active', 'Active'], ['inactive', 'Inactive']].map(([key, label]) => (
            <button key={key} className={`${styles.tab} ${tab === key ? styles.tabActive : ''}`} onClick={() => setTab(key)}>
              {label} <span className={styles.tabCount}>{counts[key]}</span>
            </button>
          ))}
        </div>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            className={styles.search}
            placeholder="Search name, email or company…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button className={styles.clearSearch} onClick={() => setSearch('')}>✕</button>}
        </div>
      </div>

      {loading ? (
        <p className={styles.empty}>Loading...</p>
      ) : filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <span>👥</span>
          <p>{search ? 'No clients match your search.' : tab === 'inactive' ? 'No inactive clients.' : 'No clients yet.'}</p>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Client</th>
                <th className={styles.center}>Tasks</th>
                <th className={styles.center}>Completed</th>
                <th>Joined</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const isActive = c.is_active !== false
                const busy = working === c.id
                return (
                  <tr key={c.id} className={!isActive ? styles.inactiveRow : ''}>
                    <td>
                      <div className={styles.clientCell}>
                        <div className={`${styles.avatar} ${!isActive ? styles.avatarInactive : ''}`}>
                          {c.name[0].toUpperCase()}
                        </div>
                        <div className={styles.clientInfo}>
                          <strong>{c.name}</strong>
                          <span>{c.email}</span>
                          {c.company && <span className={styles.company}>{c.company}</span>}
                        </div>
                      </div>
                    </td>
                    <td className={styles.center}>
                      <span className={styles.num}>{c.task_count ?? 0}</span>
                    </td>
                    <td className={styles.center}>
                      <span className={`${styles.num} ${styles.numGreen}`}>{c.completed_count ?? 0}</span>
                    </td>
                    <td className={styles.muted}>
                      {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${isActive ? styles.badgeActive : styles.badgeInactive}`}>
                        <span className={styles.dot} /> {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <Link
                          to="/admin/tasks"
                          className={styles.actionBtn}
                          title="View all tasks"
                        >
                          Tasks
                        </Link>
                        {isActive ? (
                          <button
                            className={`${styles.actionBtn} ${styles.warnBtn}`}
                            onClick={() => setConfirm({ client: c, action: 'deactivate' })}
                            disabled={busy}
                          >
                            {busy ? '…' : 'Deactivate'}
                          </button>
                        ) : (
                          <button
                            className={`${styles.actionBtn} ${styles.successBtn}`}
                            onClick={() => handleReactivate(c)}
                            disabled={busy}
                          >
                            {busy ? '…' : 'Reactivate'}
                          </button>
                        )}
                        <button
                          className={`${styles.actionBtn} ${styles.dangerBtn}`}
                          onClick={() => setConfirm({ client: c, action: 'delete' })}
                          disabled={busy}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
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
