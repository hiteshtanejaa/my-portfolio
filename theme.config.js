const YEAR = new Date().getFullYear()

export default {
  // Add the banner configuration here
  banner: {
    key: 'announcement-1', // A unique key for the banner
    text: (
      <a href="/projects" target="_blank" rel="noopener noreferrer">
        🚀 Introducing the next big thing in AI! Read More →
      </a>
    ),
    dismissible: true, // Allows users to close the banner
  },

  // Your existing footer configuration
  footer: (
    <small style={{ display: 'block', marginTop: '8rem' }}>
      <time>{YEAR}</time> © Made with ❤️ Hitesh Taneja.
      <style jsx>{`
        a {
          float: right;
        }
        @media screen and (max-width: 480px) {
          article {
            padding-top: 2rem;
            padding-bottom: 4rem;
          }
        }
      `}</style>
    </small>
  )
}
