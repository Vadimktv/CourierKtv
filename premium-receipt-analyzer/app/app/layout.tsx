
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Анализатор чеков | Premium Receipt Analyzer',
  description: 'Премиальный инструмент для извлечения данных из фотографий чеков и построения маршрутов доставки',
  keywords: ['receipt analyzer', 'OCR', 'delivery', 'route planning', 'чек анализатор'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru" className="dark">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
          {children}
          <Toaster />
        </div>
      </body>
    </html>
  )
}
