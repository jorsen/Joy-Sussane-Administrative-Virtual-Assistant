import styles from './CtaBand.module.css'

export default function CtaBand() {
  return (
    <section className={styles.band}>
      <div className={`${styles.inner} container`}>
        <div>
          <h2>Ready to get your time back?</h2>
          <p>Let's talk about how I can help your business grow.</p>
        </div>
        <a href="#contact" className={styles.btn}>Start the Conversation →</a>
      </div>
    </section>
  )
}
