const YEAR = new Date().getFullYear()

export default {
  // Add the banner configuration here
 // In theme.config.js
  banner: {
    key: 'announcement-1',
    // Try using a simple string first to test
    text: '🚀 Introducing the next big thing in AI! Check out my projects.',
    dismissible: true,
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
