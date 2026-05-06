const YEAR = new Date().getFullYear()

export default {
  darkMode: true,

  footer: (
    <footer style={{
      borderTop: '1px solid rgba(255, 255, 255, 0.06)',
      padding: '32px 0 40px',
      marginTop: '0',
      textAlign: 'center',
    }}>
      <small style={{
        color: '#475569',
        fontSize: '0.8rem',
        display: 'block',
        letterSpacing: '0.02em',
      }}>
        <style jsx>{`
          @media screen and (max-width: 480px) {
            article { padding-top: 2rem; padding-bottom: 4rem; }
          }
        `}</style>
        {YEAR} © Hitesh Taneja — Built with purpose, powered by curiosity.
      </small>
    </footer>
  )
}
