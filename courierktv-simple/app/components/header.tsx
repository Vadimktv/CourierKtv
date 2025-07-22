
'use client'

import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface HeaderProps {
  username: string
}

export default function Header({ username }: HeaderProps) {
  const router = useRouter()

  const handleLogout = () => {
    if (confirm('Вы уверены, что хотите выйти?')) {
      localStorage.removeItem('courierAuth')
      localStorage.removeItem('courierShift')
      localStorage.removeItem('courierOrders')
      router.push('/login')
    }
  }

  return (
    <header className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-10">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">CourierKtv</h1>
          <p className="text-sm text-zinc-400">Привет, {username}!</p>
        </div>
        
        <button
          onClick={handleLogout}
          className="btn-outline flex items-center gap-2 text-sm"
        >
          <LogOut className="h-4 w-4" />
          Выйти
        </button>
      </div>
    </header>
  )
}
