
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogIn } from 'lucide-react'

export default function LoginForm() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Простая валидация
    if (!username?.trim() || !password?.trim()) {
      alert('Пожалуйста, заполните все поля')
      setIsLoading(false)
      return
    }

    try {
      // Сохраняем данные в localStorage
      const userData = {
        username: username.trim(),
        isLoggedIn: true,
        loginTime: new Date().toISOString()
      }
      
      localStorage.setItem('courierAuth', JSON.stringify(userData))
      
      // Перенаправляем на главную страницу
      router.push('/')
    } catch (error) {
      console.error('Ошибка входа:', error)
      alert('Произошла ошибка при входе')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="card">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-zinc-300 mb-1">
            Имя пользователя
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input w-full"
            placeholder="Введите ваше имя"
            disabled={isLoading}
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-1">
            Пароль
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input w-full"
            placeholder="Введите пароль"
            disabled={isLoading}
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <LogIn className="h-5 w-5" />
          {isLoading ? 'Вход...' : 'Войти'}
        </button>
      </form>
    </div>
  )
}
