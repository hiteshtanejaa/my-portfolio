import 'nextra-theme-blog/style.css'
import Head from 'next/head'
import MarqueeBanner from '../components/MarqueeBanner';
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from '@vercel/analytics/react';
import '../styles/main.css'

export default function Nextra({ Component, pageProps }) {
  return (
    <>
      <Head>
        <link
          rel="alternate"
          type="application/rss+xml"
          title="RSS"
          href="/feed.xml"
        />
        <link
          rel="preload"
          href="/fonts/Inter-roman.latin.var.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </Head>
      <SpeedInsights/>
      <Analytics />
      {/* Your custom banner is placed here, outside the page content */}
      <MarqueeBanner 
        text="Introducing the next big thing in AI!" 
        link="/projects"
        linkText="Read More →"
      />
      <Component {...pageProps} />
    </>
  )
}
