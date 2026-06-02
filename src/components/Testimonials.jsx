import { useState } from 'react'
import styles from './Testimonials.module.css'

const testimonials = [
  {
    name: 'Maria Santos',
    role: 'E-commerce Store Owner',
    avatar: 'MS',
    rating: 5,
    text: 'Joy handles all my social media and product research. She delivers everything on time and always goes the extra mile. My online presence has grown significantly since we started working together.',
  },
  {
    name: 'John Rivera',
    role: 'Real Estate Agent',
    avatar: 'JR',
    rating: 5,
    text: 'I was drowning in admin work before I hired Joy. She took over my emails, calendar, and data entry — I now have time to focus on actual sales. Highly recommend her to any busy professional.',
  },
  {
    name: 'Sarah Lim',
    role: 'Online Business Coach',
    avatar: 'SL',
    rating: 5,
    text: 'What sets Joy apart is her IT background. She understood my website tools immediately and managed my blog and content uploads without any training. A true tech-savvy VA.',
  },
]

export default function Testimonials() {
  const [active, setActive] = useState(0)

  return (
    <section className={styles.section}>
      <div className="container">
        <div className="section-header center">
          <div className="section-label">Reviews</div>
          <h2 className="section-title">What Clients Say</h2>
        </div>
        <div className={styles.slider}>
          <div className={styles.card}>
            <div className={styles.stars}>{'★'.repeat(testimonials[active].rating)}</div>
            <p className={styles.quote}>"{testimonials[active].text}"</p>
            <div className={styles.author}>
              <div className={styles.avatar}>{testimonials[active].avatar}</div>
              <div>
                <strong>{testimonials[active].name}</strong>
                <span>{testimonials[active].role}</span>
              </div>
            </div>
          </div>
          <div className={styles.dots}>
            {testimonials.map((_, i) => (
              <button
                key={i}
                className={`${styles.dot} ${i === active ? styles.activeDot : ''}`}
                onClick={() => setActive(i)}
                aria-label={`Testimonial ${i + 1}`}
              />
            ))}
          </div>
          <div className={styles.nav}>
            <button onClick={() => setActive(a => (a - 1 + testimonials.length) % testimonials.length)}>←</button>
            <button onClick={() => setActive(a => (a + 1) % testimonials.length)}>→</button>
          </div>
        </div>
        <p className={styles.disclaimer}>* Testimonials are representative examples. Add your real client reviews here.</p>
      </div>
    </section>
  )
}
