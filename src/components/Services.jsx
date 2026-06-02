import styles from './Services.module.css'

const services = [
  { icon: '🔍', title: 'Web Research', desc: 'Competitor analysis, lead lists, market data, and summarised reports — delivered in your preferred format.', tags: ['Lead Gen', 'Market Research'], color: 's1' },
  { icon: '📱', title: 'Social Media Management', desc: 'Content scheduling, caption writing, engagement tracking, and keeping your brand consistent across platforms.', tags: ['Scheduling', 'Engagement'], color: 's2' },
  { icon: '🌐', title: 'Website Management', desc: 'Updates, content uploads, blog posts, and basic maintenance — backed by real web design experience.', tags: ['WordPress', 'Content'], color: 's3' },
  { icon: '📋', title: 'Admin & Data Entry', desc: 'Spreadsheet management, database updates, file organisation, and reporting. Accurate and fast.', tags: ['Google Sheets', 'Excel'], color: 's4' },
  { icon: '📧', title: 'Email & Calendar Support', desc: 'Inbox management, scheduling meetings, and keeping your daily operations running without a hitch.', tags: ['Gmail', 'Calendly'], color: 's5' },
  { icon: '💳', title: 'Payment & Records Tracking', desc: 'Transaction verification, payment status updates, and accurate financial record keeping.', tags: ['Reconciliation', 'Reporting'], color: 's6' },
]

export default function Services() {
  return (
    <section className={styles.services} id="services">
      <div className="container">
        <div className="section-label" style={{ background: 'rgba(109,40,217,0.2)' }}>What I Do</div>
        <h2 className="section-title" style={{ color: '#fff' }}>
          Services Built for<br /><span className="gradient-text">Busy Business Owners</span>
        </h2>
        <p className={styles.sub}>Everything you need to run smoother — without hiring a full-time employee.</p>
        <div className={styles.grid}>
          {services.map(({ icon, title, desc, tags, color }) => (
            <div key={title} className={styles.card}>
              <div className={`${styles.iconWrap} ${styles[color]}`}>{icon}</div>
              <h3>{title}</h3>
              <p>{desc}</p>
              <div className={styles.tags}>{tags.map(t => <span key={t}>{t}</span>)}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
