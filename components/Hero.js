import { useState, useEffect } from 'react'
import Image from 'next/image'

const ROLES = [
  'Data Engineer',
  'AI Systems Builder',
  'RAG Pipeline Architect',
  'ML Practitioner',
  'Backend Developer'
]

export default function Hero() {
  const [displayText, setDisplayText] = useState('')
  const [roleIndex, setRoleIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [charIndex, setCharIndex] = useState(0)

  useEffect(() => {
    const current = ROLES[roleIndex]
    const isFinished = !isDeleting && charIndex === current.length
    const delay = isDeleting ? 38 : isFinished ? 1800 : 75

    const timer = setTimeout(() => {
      if (!isDeleting) {
        if (charIndex < current.length) {
          setDisplayText(current.slice(0, charIndex + 1))
          setCharIndex(c => c + 1)
        } else {
          setIsDeleting(true)
        }
      } else {
        if (charIndex > 0) {
          setDisplayText(current.slice(0, charIndex - 1))
          setCharIndex(c => c - 1)
        } else {
          setIsDeleting(false)
          setRoleIndex(r => (r + 1) % ROLES.length)
        }
      }
    }, delay)

    return () => clearTimeout(timer)
  }, [charIndex, isDeleting, roleIndex])

  return (
    <section className="hero">
      {/* Animated background layers */}
      <div className="hero-grid" aria-hidden="true" />
      <div className="hero-orb hero-orb-1" aria-hidden="true" />
      <div className="hero-orb hero-orb-2" aria-hidden="true" />
      <div className="hero-orb hero-orb-3" aria-hidden="true" />

      {/* Main content */}
      <div className="hero-inner">

        {/* Photo column */}
        <div className="hero-photo-wrap">
          <div className="hero-photo-glow" aria-hidden="true" />
          <div className="hero-photo-ring" aria-hidden="true" />
          <Image
            src="/images/Photo 2025.jpeg"
            alt="Hitesh Taneja"
            width={188}
            height={188}
            priority
            className="hero-photo"
          />
          <div className="hero-available">
            <span className="hero-available-dot" aria-hidden="true" />
            Open to opportunities
          </div>
        </div>

        {/* Text column */}
        <div className="hero-content">
          <div className="hero-eyebrow">
            <span className="hero-eyebrow-bar" aria-hidden="true" />
            Based in the UK&nbsp;·&nbsp;Available Globally
          </div>

          <h1 className="hero-name">
            Hitesh{' '}
            <span className="hero-name-gradient">Taneja</span>
          </h1>

          <div className="hero-typewriter" aria-label={`Role: ${displayText}`}>
            <span className="hero-typewriter-prefix" aria-hidden="true">{'// '}</span>
            <span>{displayText}</span>
            <span className="hero-cursor" aria-hidden="true">_</span>
          </div>

          <p className="hero-bio">
            I build the data infrastructure powering modern AI — ETL pipelines,
            FastAPI backends, and RAG systems that turn raw data into intelligence.
            Ex-Accenture · NatWest Group · MSc AI&nbsp;&amp;&nbsp;ML.
          </p>

          <div className="hero-tags" aria-label="Technologies">
            {['Python', 'PySpark', 'FastAPI', 'LLMs', 'Vector DBs', 'SQL', 'RAG', 'AWS'].map(t => (
              <span key={t} className="hero-tag">{t}</span>
            ))}
          </div>

          <div className="hero-actions">
            <a href="/projects" className="btn-primary">
              Explore Projects
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
            <a
              href="https://calendly.com/hiteshtaneja00/30min"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
            >
              Schedule a Call
            </a>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="hero-stats" role="list" aria-label="Key stats">
        <div className="hero-stat" role="listitem">
          <span className="hero-stat-number">3+</span>
          <span className="hero-stat-label">Years in Data Eng</span>
        </div>
        <div className="hero-stat-sep" aria-hidden="true" />
        <div className="hero-stat" role="listitem">
          <span className="hero-stat-number">2</span>
          <span className="hero-stat-label">Production AI Systems</span>
        </div>
        <div className="hero-stat-sep" aria-hidden="true" />
        <div className="hero-stat" role="listitem">
          <span className="hero-stat-number">MSc</span>
          <span className="hero-stat-label">AI &amp; Machine Learning</span>
        </div>
        <div className="hero-stat-sep" aria-hidden="true" />
        <div className="hero-stat" role="listitem">
          <span className="hero-stat-number">40%</span>
          <span className="hero-stat-label">Query Speedup Achieved</span>
        </div>
      </div>
    </section>
  )
}
