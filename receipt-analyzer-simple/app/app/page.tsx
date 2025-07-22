
import Link from 'next/link'
import { Bike, UtensilsCrossed, Zap, Camera, TrendingUp, Sparkles } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-10">
        {/* Hero Section */}
        <div className="text-center space-y-6 animate-fade-in">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-yellow-400/25">
              <Camera className="text-primary-foreground" size={36} />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
              <Sparkles className="text-white" size={12} />
            </div>
          </div>
          
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mb-3">
              Анализатор чеков
            </h1>
            <p className="text-lg text-muted-foreground mb-2">
              ИИ-помощник курьера
            </p>
            <p className="text-sm text-muted-foreground">
              Выберите свою роль для входа в систему
            </p>
          </div>
        </div>

        {/* Role Selection Cards */}
        <div className="space-y-4 animate-slide-in" style={{ animationDelay: '0.2s' }}>
          <Link href="/login/courier" className="block group">
            <div className="order-card group-hover:scale-[1.02] transition-transform duration-300">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-400/25 group-hover:shadow-blue-400/40 transition-shadow">
                  <Bike className="text-white" size={28} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h2 className="text-xl font-bold text-foreground">
                      Я — Курьер
                    </h2>
                    <div className="bg-blue-500/20 text-blue-400 text-xs px-2 py-1 rounded-full font-medium">
                      Популярно
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-2">
                    Сканирование и обработка чеков
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Camera size={12} />
                      <span>ИИ-анализ</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <TrendingUp size={12} />
                      <span>Статистика</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/login/restaurant" className="block group">
            <div className="order-card group-hover:scale-[1.02] transition-transform duration-300">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-400/25 group-hover:shadow-purple-400/40 transition-shadow">
                  <UtensilsCrossed className="text-white" size={28} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h2 className="text-xl font-bold text-foreground">
                      Я — Ресторан
                    </h2>
                    <div className="bg-purple-500/20 text-purple-400 text-xs px-2 py-1 rounded-full font-medium">
                      Скоро
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-2">
                    Управление заказами и меню
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <UtensilsCrossed size={12} />
                      <span>Заказы</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <TrendingUp size={12} />
                      <span>Аналитика</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-3 gap-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Zap className="text-white" size={18} />
            </div>
            <div className="text-sm font-semibold text-foreground mb-1">Быстро</div>
            <div className="text-xs text-muted-foreground">2-3 сек анализ</div>
          </div>

          <div className="text-center p-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Camera className="text-white" size={18} />
            </div>
            <div className="text-sm font-semibold text-foreground mb-1">Точно</div>
            <div className="text-xs text-muted-foreground">ИИ-технологии</div>
          </div>

          <div className="text-center p-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="text-white" size={18} />
            </div>
            <div className="text-sm font-semibold text-foreground mb-1">Удобно</div>
            <div className="text-xs text-muted-foreground">Автоматизация</div>
          </div>
        </div>

        {/* Bottom Info */}
        <div className="stats-card text-center animate-slide-in" style={{ animationDelay: '0.6s' }}>
          <div className="flex items-center justify-center space-x-2 mb-3">
            <Sparkles className="text-yellow-400" size={16} />
            <span className="text-sm font-bold text-foreground">Демо доступ</span>
            <Sparkles className="text-yellow-400" size={16} />
          </div>
          <p className="text-xs text-muted-foreground">
            Тестовый аккаунт: <span className="text-primary font-mono">john@doe.com</span>
          </p>
        </div>
      </div>
    </div>
  )
}
