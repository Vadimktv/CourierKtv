
import { LoginForm } from '@/components/login-form'
import { redirect } from 'next/navigation'

interface LoginPageProps {
  params: {
    role: string
  }
}

export default function LoginPage({ params }: LoginPageProps) {
  if (params?.role !== 'courier' && params?.role !== 'restaurant') {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <LoginForm role={params.role} />
      </div>
    </div>
  )
}
