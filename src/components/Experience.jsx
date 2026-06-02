import styles from './Experience.module.css'

const jobs = [
  {
    period: '2020–Now',
    title: 'Business Operations Manager',
    company: 'Family Business – Piggery',
    current: true,
    desc: 'End-to-end operations management — overseeing financial records and expense tracking, feed inventory and procurement, delivery logistics, supplier coordination, and full budget management. Responsible for all day-to-day financial decisions and operational reporting.',
  },
  {
    period: '2019–2020',
    title: 'Payment Officer',
    company: 'Digital Vertex Inc.',
    current: false,
    desc: 'Verified client payments against bank records, updated statuses in spreadsheets, and maintained accurate compliance reports for internal tracking.',
  },
  {
    period: '2017–2018',
    title: 'Web Designer',
    company: 'Ark One Solutions Inc.',
    current: false,
    desc: 'Designed and built web pages, collaborated with clients on layouts, and delivered clean, functional websites on schedule.',
  },
]

export default function Experience() {
  return (
    <section className={styles.section} id="experience">
      <div className="container">
        <div className="section-label">Work History</div>
        <h2 className="section-title">Experience</h2>
        <div className={styles.timeline}>
          {jobs.map(({ period, title, company, current, desc }) => (
            <div key={title} className={styles.item}>
              <div className={styles.marker}>
                <div className={styles.dot} />
                <span>{period}</span>
              </div>
              <div className={styles.content}>
                {current && <span className={styles.badge}>Current</span>}
                <h3>{title}</h3>
                <p className={styles.company}>{company}</p>
                <p>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
