import styles from './WhyMe.module.css'

const items = [
  { icon: '⚡', title: 'Fast & Reliable', desc: 'Tasks delivered on time, every time. No hand-holding needed.' },
  { icon: '💻', title: 'Tech-Savvy', desc: 'BS in IT + web design background. I learn new tools fast.' },
  { icon: '🎯', title: 'Detail-Oriented', desc: 'Accuracy matters. Your data and reports will always be clean.' },
  { icon: '💬', title: 'Clear Communicator', desc: 'Regular updates, zero guesswork. You\'ll always know the status.' },
]

export default function WhyMe() {
  return (
    <section className={styles.why}>
      <div className="container">
        <div className={styles.grid}>
          {items.map(({ icon, title, desc }) => (
            <div key={title} className={styles.item}>
              <div className={styles.icon}>{icon}</div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
