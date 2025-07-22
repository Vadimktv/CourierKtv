
import dynamic from 'next/dynamic'

const ReceiptAnalyzer = dynamic(() => import('@/components/receipt-analyzer').then(mod => ({ default: mod.ReceiptAnalyzer })), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-16">
      <div className="text-primary">Загрузка...</div>
    </div>
  )
})

export default function Home() {
  return (
    <main className="min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-primary-300 to-primary bg-clip-text text-transparent">
            Анализатор чеков
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Загрузите фото чеков для мгновенного извлечения данных и построения маршрутов доставки
          </p>
        </div>

        {/* Main Analyzer Component */}
        <ReceiptAnalyzer />
      </div>
    </main>
  )
}
