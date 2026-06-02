import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`${styles.inner} container`}>
        <span className={styles.logo}>Joy<span>.</span></span>
        <p>Virtual Assistant · Batangas, Philippines</p>
        <div className={styles.links}>
          <a href="mailto:joysussanesandro.0019@gmail.com">Email</a>
          <a href="https://www.linkedin.com/in/joysussane" target="_blank" rel="noopener">LinkedIn</a>
        </div>
        <p className={styles.copy}>&copy; 2026 Joy Sussane Sandro. All rights reserved.</p>
      </div>
    </footer>
  )
}
