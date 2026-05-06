const WORK = [
  {
    company: 'Accenture',
    client: 'Client: NatWest Group',
    role: 'Data Engineer',
    period: '2022 — 2024',
    description:
      'Led data pipeline automation for an Irish financial institution managing the closure of 63 branches. Built PySpark ETL workflows, FastAPI backends, and architected the retrieval infrastructure for a RAG-based internal knowledge tool using Vector Databases — bridging data engineering with production AI.',
    tags: ['PySpark', 'FastAPI', 'RAG', 'Vector DBs', 'Python', 'SQL', 'Autosys', 'SSIS', 'CI/CD'],
  },
  {
    company: 'Freelance Data Consultant',
    role: 'SQL & Data Engineering',
    period: '2021 — 2022',
    description:
      'Re-engineered complex SQL queries (window functions, joins) for smart meter data processing, improving report generation speed by 40%. Built automated data validation scripts reducing downstream errors by 25%, and designed Tableau dashboards for executive decision-making.',
    tags: ['SQL', 'Tableau', 'Python', 'Data Quality', 'MDMS', 'Automation'],
  },
  {
    company: 'StudyPool & Freelance Web',
    role: 'Tutor & Web Developer',
    period: '2019 — 2021',
    description:
      'Worked as a tutor on StudyPool while helping 3 small businesses bring their presence online as a freelance web developer.',
    tags: ['Web Development', 'WordPress', 'Client Work'],
  },
]

export default function WorkSection() {
  return (
    <div className="work-timeline">
      {WORK.map((job, i) => (
        <div className="work-item" key={i}>
          <div className="work-dot" aria-hidden="true" />
          <div className="work-header">
            <div>
              <div className="work-company">
                {job.company}
                {job.client && (
                  <span style={{ fontWeight: 400, fontSize: '0.82rem', color: 'var(--text-muted)', marginLeft: '8px' }}>
                    · {job.client}
                  </span>
                )}
              </div>
              <div className="work-role">{job.role}</div>
            </div>
            <div className="work-period">{job.period}</div>
          </div>
          <p className="work-desc">{job.description}</p>
          <div className="work-tags">
            {job.tags.map(t => (
              <span key={t} className="work-tag">{t}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
