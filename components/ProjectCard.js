const ExternalIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
)

const GithubIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" />
  </svg>
)

const LINK_ICONS = {
  github: GithubIcon,
  notebook: ExternalIcon,
  demo: ExternalIcon,
  paper: ExternalIcon,
  case: ExternalIcon,
  dashboard: ExternalIcon,
  default: ExternalIcon,
}

function getLinkIcon(label = '') {
  const l = label.toLowerCase()
  if (l.includes('github')) return LINK_ICONS.github
  return LINK_ICONS.default
}

export default function ProjectCard({ badge, badgeType = 'ai', title, description, stack = [], links = [] }) {
  return (
    <article className="project-card">
      <span className={`project-card-badge badge-${badgeType}`}>
        <span className="badge-dot" aria-hidden="true" />
        {badge}
      </span>

      <h3 className="project-card-title">{title}</h3>
      <p className="project-card-desc">{description}</p>

      {stack.length > 0 && (
        <div className="project-card-stack" aria-label="Tech stack">
          {stack.map(t => (
            <span key={t} className="stack-tag">{t}</span>
          ))}
        </div>
      )}

      {links.length > 0 && (
        <div className="project-card-links">
          {links.map(({ label, href }) => {
            const Icon = getLinkIcon(label)
            return (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="project-link"
              >
                {label}
                <Icon />
              </a>
            )
          })}
        </div>
      )}
    </article>
  )
}
