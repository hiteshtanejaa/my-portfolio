// components/MarqueeBanner.js

import React from 'react';

const MarqueeBanner = ({ text, link, linkText }) => {
  return (
    <div style={{
      width: '100%',
      backgroundColor: '#1a1a1a', // Dark background to match your site
      color: 'white',
      padding: '8px 0', // Vertical padding
      overflow: 'hidden', // Hide content that goes outside the div
      whiteSpace: 'nowrap', // Prevent text from wrapping
      boxShadow: '0 2px 5px rgba(0, 0, 0, 0.25)',
      position: 'relative', // Needed for absolute positioning of inner span
      fontSize: '0.9rem',
      fontWeight: '500',
    }}>
      <span style={{
        display: 'inline-block',
        paddingLeft: '100%', // Start text off-screen to the right
        animation: 'marquee 30s linear infinite', // Marquee animation
        // Define keyframes for the animation (can't define directly in JSX style, so we'll need a global CSS)
      }}>
        {text}{' '}
        {link && linkText && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: 'white',
              textDecoration: 'underline',
              marginLeft: '5px'
            }}
          >
            {linkText}
          </a>
        )}
      </span>

      {/* This is a simple workaround for inline styles. For complex animations, 
          a global CSS file is usually better. */}
      <style jsx global>{`
        @keyframes marquee {
          0%   { transform: translate(0, 0); }
          100% { transform: translate(-100%, 0); }
        }
      `}</style>
    </div>
  );
};

export default MarqueeBanner;

