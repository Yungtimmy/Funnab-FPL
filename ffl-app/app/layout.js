import Nav from './components/Nav'
import './globals.css'

export const metadata = {
  title: 'Fantasy FUNAAB League',
  description: 'Pick real FUNAAB footballers and compete for the prize pool',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ background:'#080C0A', margin:0, padding:0, fontFamily:'sans-serif' }}>
        <Nav />
        {children}
      </body>
    </html>
  )
}