import styles from './Skills.module.css'

const skills = [
  '🔍 Web Research', '📱 Social Media Management', '🌐 Website Management',
  '📊 Google Sheets / Excel', '📁 Google Workspace', '💼 Microsoft Office',
  '💳 Payment Reconciliation', '📧 Email Management', '🎨 HTML / CSS',
  '📋 Data Entry', '📅 Calendar Management', '📝 Report Generation',
]

export default function Skills() {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className="section-header center">
          <div className="section-label">Tools & Skills</div>
          <h2 className="section-title">What I Work With</h2>
        </div>
        <div className={styles.grid}>
          {skills.map(s => <div key={s} className={styles.pill}>{s}</div>)}
        </div>
      </div>
    </section>
  )
}
