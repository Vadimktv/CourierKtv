
import { redirect } from 'next/navigation'
import MainDashboard from '../components/main-dashboard'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <MainDashboard />
    </div>
  )
}
