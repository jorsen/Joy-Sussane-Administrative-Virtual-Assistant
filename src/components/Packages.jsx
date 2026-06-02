import styles from './Packages.module.css'

const packages = [
  {
    name: 'Starter',
    desc: 'Perfect for solopreneurs needing occasional help',
    price: "Let's Talk",
    per: '/ project',
    features: ['Web Research', 'Data Entry', 'Email Support', 'Up to 20 hrs/mo'],
    featured: false,
  },
  {
    name: 'Growth',
    desc: 'For businesses ready to scale with consistent VA support',
    price: "Let's Talk",
    per: '/ month',
    features: ['Everything in Starter', 'Social Media Management', 'Website Management', 'Calendar & Scheduling', 'Up to 40 hrs/mo'],
    featured: true,
  },
  {
    name: 'Full Support',
    desc: 'Dedicated full-time virtual assistant for your business',
    price: "Let's Talk",
    per: '/ month',
    features: ['Everything in Growth', 'Payment & Records Tracking', 'Priority Response', '160 hrs/mo (Full-time)'],
    featured: false,
  },
]

export default function Packages() {
  return (
    <section className={styles.section} id="packages">
      <div className="container">
        <div className="section-header center">
          <div className="section-label">Pricing</div>
          <h2 className="section-title">Flexible Packages</h2>
          <p className="section-sub">Transparent, simple pricing. No surprises.</p>
        </div>
        <div className={styles.grid}>
          {packages.map(({ name, desc, price, per, features, featured }) => (
            <div key={name} className={`${styles.card} ${featured ? styles.featured : ''}`}>
              {featured && <div className={styles.badge}>Most Popular</div>}
              <div className={styles.top}>
                <h3>{name}</h3>
                <p>{desc}</p>
              </div>
              <div className={styles.price}>{price} <span>{per}</span></div>
              <ul className={styles.features}>
                {features.map(f => <li key={f}>✓ {f}</li>)}
              </ul>
              <a href="#contact" className={featured ? 'btn-primary' : 'btn-outline'}>Get Quote</a>
            </div>
          ))}
        </div>
        <p className={styles.note}>All packages are fully customisable. <a href="#contact">Message me</a> and we'll build the right fit.</p>
      </div>
    </section>
  )
}
