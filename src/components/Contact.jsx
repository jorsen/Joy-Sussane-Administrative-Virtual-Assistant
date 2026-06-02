import { useState } from 'react'
import styles from './Contact.module.css'

const services = ['Web Research','Social Media Management','Website Management','Admin & Data Entry','Email & Calendar Support','Payment & Records Tracking','Full VA Support (Multiple Services)']

export default function Contact() {
  const [sent, setSent] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    setSent(true)
    e.target.reset()
    setTimeout(() => setSent(false), 6000)
  }

  return (
    <section className={styles.section} id="contact">
      <div className="container">
        <div className="section-label">Contact</div>
        <h2 className="section-title">Let's Work Together</h2>
        <p className="section-sub">I reply within 24 hours. No commitment needed — just a conversation.</p>
        <div className={styles.grid}>
          <div className={styles.info}>
            {[
              { icon: '📧', label: 'Email', value: 'joysussanesandro.0019@gmail.com', href: 'mailto:joysussanesandro.0019@gmail.com' },
              { icon: '💼', label: 'LinkedIn', value: 'linkedin.com/in/joysussane', href: 'https://www.linkedin.com/in/joysussane' },
              { icon: '📍', label: 'Location', value: 'Batangas, Calabarzon, Philippines' },
              { icon: '🕐', label: 'Timezone', value: 'PHT (UTC+8) — flexible hours' },
            ].map(({ icon, label, value, href }) => (
              <div key={label} className={styles.item}>
                <div className={styles.iconWrap}>{icon}</div>
                <div>
                  <strong>{label}</strong>
                  {href ? <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener">{value}</a> : <span>{value}</span>}
                </div>
              </div>
            ))}
            <div className={styles.guarantee}>
              🤝 First consultation is <strong>completely free</strong>. Let's see if we're a good fit.
            </div>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.row}>
              <div className={styles.group}>
                <label>Your Name</label>
                <input type="text" placeholder="Jane Smith" required />
              </div>
              <div className={styles.group}>
                <label>Your Email</label>
                <input type="email" placeholder="jane@example.com" required />
              </div>
            </div>
            <div className={styles.group}>
              <label>Service Needed</label>
              <select>
                <option value="">Select a service...</option>
                {services.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className={styles.group}>
              <label>Tell Me About Your Project</label>
              <textarea rows={5} placeholder="What do you need help with? The more detail, the better..." required />
            </div>
            <button type="submit" className={styles.submit}>Send Message →</button>
            {sent && <p className={styles.success}>✅ Message sent! I'll get back to you within 24 hours.</p>}
          </form>
        </div>
      </div>
    </section>
  )
}
