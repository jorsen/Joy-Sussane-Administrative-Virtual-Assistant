import { useState, useEffect } from 'react'
import styles from './Nav.module.css'

const links = ['About', 'Services', 'Packages', 'Experience', 'Booking', 'Portal']

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`}>
      <div className={`${styles.inner} container`}>
        <span className={styles.logo}>Joy<span>.</span></span>
        <ul className={`${styles.links} ${open ? styles.open : ''}`}>
          {links.map(l => (
            <li key={l}>
              {l === 'Portal'
                ? <a href="/login" onClick={() => setOpen(false)}>Client Portal</a>
                : <a href={`#${l.toLowerCase()}`} onClick={() => setOpen(false)}>{l}</a>
              }
            </li>
          ))}
          <li>
            <a href="#contact" className={styles.hireBtnLink} onClick={() => setOpen(false)}>
              Hire Me →
            </a>
          </li>
        </ul>
        <button className={styles.hamburger} onClick={() => setOpen(o => !o)} aria-label="menu">
          <span /><span /><span />
        </button>
      </div>
    </nav>
  )
}
