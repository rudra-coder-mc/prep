import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'prep', template: '%s · prep' },
  description: 'Personal learning platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  )
}
