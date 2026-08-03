import React from 'react'
import './styles.css'

export const metadata = {
  description: 'The mobile companion for the GESAwards Bootcamp.',
  title: 'GESAwards Bootcamp · Companion',
}

export const viewport = {
  colorScheme: 'dark',
  themeColor: '#090c12',
  viewportFit: 'cover',
  width: 'device-width',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}
