import styles from './About.module.css'

const highlights = [
  { icon: '🎓', title: 'BS Information Technology', sub: 'STI College, 2014–2018' },
  { icon: '💼', title: '7+ Years Combined Experience', sub: 'Operations · Finance · Payments · Web Design' },
  { icon: '🌐', title: 'Web Design Background', sub: 'Former designer at Ark One Solutions' },
  { icon: '📊', title: 'Data & Records Expert', sub: 'Payment verification & spreadsheet management' },
]

export default function About() {
  return (
    <section className={`${styles.about} section`} id="about">
      <div className={`${styles.inner} container`}>
        <div className={styles.left}>
          <div className="section-label">About Me</div>
          <h2 className="section-title">
            Not Just an Assistant.<br />
            <span className="gradient-text">A Business Partner.</span>
          </h2>
          <p>I'm Joy Sussane, a Virtual Assistant based in Batangas, Philippines with a <strong>BS in Information Technology</strong> and 7+ years of real-world experience across web design, payment processing, and business operations management.</p>
          <p>While most VAs only handle one thing, I bring a <strong>full skill set</strong> — which means fewer tools, fewer people, and more value for your money.</p>
          <a href="#contact" className="btn-primary" style={{ marginTop: '24px', display: 'inline-flex' }}>Work With Me</a>
        </div>
        <div className={styles.right}>
          {highlights.map(({ icon, title, sub }) => (
            <div key={title} className={styles.card}>
              <div className={styles.cardIcon}>{icon}</div>
              <div>
                <strong>{title}</strong>
                <p>{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
