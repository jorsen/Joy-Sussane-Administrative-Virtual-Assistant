import { useEffect } from 'react'
import styles from './Booking.module.css'

export default function Booking() {
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://assets.calendly.com/assets/external/widget.js'
    script.async = true
    document.body.appendChild(script)
    return () => document.body.removeChild(script)
  }, [])

  return (
    <section className={styles.section} id="booking">
      <div className="container">
        <div className="section-header center">
          <div className="section-label">Book a Call</div>
          <h2 className="section-title">Schedule a Free Consultation</h2>
          <p className="section-sub">
            Pick a time that works for you. No commitment — just a friendly 30-minute chat
            to see how I can help your business.
          </p>
        </div>
        <div className={styles.wrapper}>
          <div
            className="calendly-inline-widget"
            data-url="https://calendly.com/joysussanesandro-0019/30min?hide_landing_page_details=1&hide_gdpr_banner=1&primary_color=6d28d9"
            style={{ minWidth: '320px', height: '700px' }}
          />
        </div>
        <p className={styles.note}>
          Don't have time right now? <a href="#contact">Send a message instead →</a>
        </p>
      </div>
    </section>
  )
}
