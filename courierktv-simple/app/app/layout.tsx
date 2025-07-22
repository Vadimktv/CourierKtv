
import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'CourierKtv - Приложение для курьеров',
  description: 'Простое и надежное приложение для курьеров',
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className="min-h-screen bg-zinc-950 text-zinc-100">
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  )
}
