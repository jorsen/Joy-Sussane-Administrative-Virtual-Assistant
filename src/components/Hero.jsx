import { useEffect, useRef } from 'react'
import styles from './Hero.module.css'
import avatar from '../assets/joy-sussane.jpg'

const floatingCards = [
  { icon: '🔍', label: 'Research Done', sub: '24hr turnaround', cls: 'fc1' },
  { icon: '⭐', label: 'Fast Learner', sub: 'IT Graduate', cls: 'fc2' },
  { icon: '🌐', label: 'Remote Ready', sub: 'Full-time / Part-time', cls: 'fc3' },
]

export default function Hero() {
  const countersRef = useRef([])

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return
        const el = entry.target
        const target = parseInt(el.dataset.target)
        let current = 0
        const step = target / 40
        const timer = setInterval(() => {
          current = Math.min(current + step, target)
          el.textContent = Math.floor(current)
          if (current >= target) clearInterval(timer)
        }, 30)
        observer.unobserve(el)
      })
    }, { threshold: 0.5 })

    countersRef.current.forEach(el => el && observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <section className={styles.hero}>
      <div className={styles.shapes}>
        <div className={`${styles.shape} ${styles.s1}`} />
        <div className={`${styles.shape} ${styles.s2}`} />
        <div className={`${styles.shape} ${styles.s3}`} />
      </div>
      <div className={`${styles.inner} container`}>
        <div className={styles.text}>
          <div className={styles.pill}>
            <span className={styles.dot} /> Available for New Clients
          </div>
          <h1 className={styles.heading}>
            Your Business.<br />
            <span className={styles.gradient}>Done Right.</span>
          </h1>
          <p className={styles.tagline}>
            I'm <strong>Joy Sussane</strong> — a tech-savvy Virtual Assistant from the Philippines
            with 7+ years of experience helping businesses stay organised, visible, and stress-free.
          </p>
          <div className={styles.cta}>
            <a href="#contact" className="btn-primary">Get Started Today</a>
            <a href="#services" className="btn-ghost">Explore Services ↓</a>
          </div>
          <div className={styles.proof}>
            <div className={styles.proofItem}>
              <strong ref={el => countersRef.current[0] = el} data-target="7">0</strong>
              <span>+ Years<br/>Experience</span>
            </div>
            <div className={styles.divider} />
            <div className={styles.proofItem}>
              <strong ref={el => countersRef.current[1] = el} data-target="3">0</strong>
              <span>Industries<br/>Served</span>
            </div>
            <div className={styles.divider} />
            <div className={styles.proofItem}>
              <strong>BS</strong>
              <span>IT Degree<br/>Holder</span>
            </div>
          </div>
        </div>

        <div className={styles.visual}>
          <div className={styles.card}>
            <div className={styles.glow} />
            <div className={styles.avatar}>
              <img src={avatar} alt="Joy Sussane Sandro" />
            </div>
            <h3>Joy Sussane Sandro</h3>
            <p>Virtual Assistant · Philippines</p>
            <div className={styles.tags}>
              {['Web Research','Social Media','Web Design','Admin Support','Data Entry'].map(t => (
                <span key={t}>{t}</span>
              ))}
            </div>
            <div className={styles.status}>
              <span className={styles.dot} /> Open to work
            </div>
          </div>
          {floatingCards.map(({ icon, label, sub, cls }) => (
            <div key={cls} className={`${styles.fc} ${styles[cls]}`}>
              <span>{icon}</span>
              {label}
              <strong>{sub}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
