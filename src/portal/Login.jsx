import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { api } from './api'
import styles from './Login.module.css'

export default function Login() {
  const [tab, setTab] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '', company: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      let res
      if (tab === 'login') {
        res = await api.login(form.email, form.password)
      } else {
        res = await api.register(form)
      }
      login(res.token, res.user)
      navigate(res.user.role === 'admin' ? '/admin' : '/portal')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <Link to="/" className={styles.back}>← Back to site</Link>
        <div className={styles.logo}>Joy<span>.</span></div>
        <h2>{tab === 'login' ? 'Welcome back' : 'Create your account'}</h2>
        <p>{tab === 'login' ? 'Sign in to your client portal' : 'Join to start working with Joy'}</p>

        <div className={styles.tabs}>
          <button className={tab === 'login' ? styles.active : ''} onClick={() => setTab('login')}>Sign In</button>
          <button className={tab === 'register' ? styles.active : ''} onClick={() => setTab('register')}>Register</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {tab === 'register' && (
            <>
              <div className={styles.group}>
                <label>Full Name</label>
                <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Jane Smith" required />
              </div>
              <div className={styles.group}>
                <label>Company (optional)</label>
                <input value={form.company} onChange={e => setForm(f => ({...f, company: e.target.value}))} placeholder="Your Business Name" />
              </div>
            </>
          )}
          <div className={styles.group}>
            <label>Email</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} placeholder="you@example.com" required />
          </div>
          <div className={styles.group}>
            <label>Password</label>
            <input type="password" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} placeholder="••••••••" required />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className={styles.submit} disabled={loading}>
            {loading ? 'Please wait...' : tab === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  )
}
