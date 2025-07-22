
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from './header'
import ShiftSection from './shift-section'
import NewOrderSection from './new-order-section'
import OrderHistory from './order-history'
import { loadUserData } from '../lib/storage'

export default function MainDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [username, setUsername] = useState('')
  const router = useRouter()

  useEffect(() => {
    const userData = loadUserData()
    
    if (!userData?.isLoggedIn) {
      router.push('/login')
      return
    }
    
    setIsLoggedIn(true)
    setUsername(userData.username || 'Курьер')
    setIsLoading(false)
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-zinc-400">Загрузка...</p>
        </div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return null
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header username={username} />
      
      <main className="max-w-md mx-auto p-4 space-y-6">
        <ShiftSection />
        <NewOrderSection />
        <OrderHistory />
      </main>
    </div>
  )
}
