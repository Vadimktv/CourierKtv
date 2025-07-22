
'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Bike, UtensilsCrossed, ArrowLeft, User, Mail, Lock, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface LoginFormProps {
  role: string
}

export function LoginForm({ role }: LoginFormProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isLogin) {
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        })

        if (result?.error) {
          setError('Неверный email или пароль')
        } else {
          router.push('/dashboard')
        }
      } else {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, role }),
        })

        if (response.ok) {
          // Автоматически входим после регистрации
          const result = await signIn('credentials', {
            email,
            password,
            redirect: false,
          })

          if (result?.error) {
            setError('Ошибка при входе')
          } else {
            router.push('/dashboard')
          }
        } else {
          const data = await response.json()
          setError(data.error || 'Ошибка при регистрации')
        }
      }
    } catch (err) {
      setError('Произошла ошибка. Попробуйте еще раз.')
    } finally {
      setLoading(false)
    }
  }

  const roleTitle = role === 'courier' ? 'Курьер' : 'Ресторан'
  const RoleIcon = role === 'courier' ? Bike : UtensilsCrossed
  const roleColor = role === 'courier' ? 'from-blue-400 to-blue-600' : 'from-purple-400 to-purple-600'

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-md">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center space-x-4 animate-fade-in">
            <Link 
              href="/" 
              className="w-10 h-10 bg-card border border-border rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary transition-all"
            >
              <ArrowLeft size={20} />
            </Link>
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 bg-gradient-to-br ${roleColor} rounded-2xl flex items-center justify-center shadow-lg`}>
                <RoleIcon className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {isLogin ? 'Добро пожаловать!' : 'Создать аккаунт'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {roleTitle} • {isLogin ? 'Войти в систему' : 'Присоединиться'}
                </p>
              </div>
            </div>
          </div>

          {/* Main Form Card */}
          <div className="stats-card animate-slide-in" style={{ animationDelay: '0.1s' }}>
            <form onSubmit={handleSubmit} className="space-y-6">
              {!isLogin && (
                <div className="animate-fade-in">
                  <label htmlFor="name" className="block text-sm font-semibold text-foreground mb-3">
                    Полное имя
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                      <User className="text-muted-foreground" size={18} />
                    </div>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="form-input pl-12"
                      required={!isLogin}
                      placeholder="Введите ваше полное имя"
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-foreground mb-3">
                  Email адрес
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    <Mail className="text-muted-foreground" size={18} />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input pl-12"
                    required
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-foreground mb-3">
                  Пароль
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    <Lock className="text-muted-foreground" size={18} />
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input pl-12"
                    required
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-gradient-to-r from-red-500/20 to-red-600/20 border-2 border-red-500/30 rounded-2xl p-4 animate-slide-in">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">!</span>
                    </div>
                    <div className="text-red-300 text-sm">{error}</div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-3">
                    <div className="loading-spinner" />
                    <span>{isLogin ? 'Входим...' : 'Создаем аккаунт...'}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <span>{isLogin ? 'Войти в систему' : 'Создать аккаунт'}</span>
                    <Sparkles size={16} />
                  </div>
                )}
              </button>
            </form>

            <div className="text-center pt-6 border-t border-border/50">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                {isLogin ? 'Нет аккаунта? Создать' : 'Уже есть аккаунт? Войти'}
              </button>
            </div>
          </div>

          {/* Demo Access Card */}
          <div className="order-card animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center">
                <Sparkles className="text-white" size={16} />
              </div>
              <h3 className="font-bold text-foreground">Демо доступ</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Email:</span>
                <code className="text-sm font-mono bg-muted px-2 py-1 rounded text-primary">
                  john@doe.com
                </code>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Пароль:</span>
                <code className="text-sm font-mono bg-muted px-2 py-1 rounded text-primary">
                  johndoe123
                </code>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl">
              <p className="text-xs text-muted-foreground text-center">
                Готовый тестовый аккаунт для быстрого старта
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-3 animate-slide-in" style={{ animationDelay: '0.3s' }}>
            <div className="text-center p-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Sparkles className="text-white" size={18} />
              </div>
              <div className="text-xs font-medium text-foreground">Быстро</div>
              <div className="text-xs text-muted-foreground">Мгновенный вход</div>
            </div>
            
            <div className="text-center p-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Lock className="text-white" size={18} />
              </div>
              <div className="text-xs font-medium text-foreground">Безопасно</div>
              <div className="text-xs text-muted-foreground">Защищенно</div>
            </div>
            
            <div className="text-center p-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-2">
                <User className="text-white" size={18} />
              </div>
              <div className="text-xs font-medium text-foreground">Удобно</div>
              <div className="text-xs text-muted-foreground">Простой UX</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
