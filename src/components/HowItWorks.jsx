import { Fragment } from 'react'
import styles from './HowItWorks.module.css'

const steps = [
  { num: '01', title: 'You Reach Out', desc: 'Fill out the contact form or email me. Tell me what you need — no obligation.' },
  { num: '02', title: 'We Talk It Through', desc: 'Quick call or chat to align on scope, timelines, and expectations.' },
  { num: '03', title: 'I Get to Work', desc: 'You focus on your business. I handle the rest — with regular updates.' },
]

export default function HowItWorks() {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className="section-header center">
          <div className="section-label">Simple Process</div>
          <h2 className="section-title">How We Get Started</h2>
        </div>
        <div className={styles.grid}>
          {steps.map(({ num, title, desc }, i) => (
            <Fragment key={num}>
              <div className={styles.step}>
                <div className={styles.num}>{num}</div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
              {i < steps.length - 1 && <div className={styles.arrow}>→</div>}
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  )
}
