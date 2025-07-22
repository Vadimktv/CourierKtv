
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Eye, EyeOff, UserCheck, Building2 } from 'lucide-react';
import Link from 'next/link';

interface AuthFormProps {
  mode: 'signin' | 'signup';
  role: 'courier' | 'restaurant';
}

export function AuthForm({ mode, role }: AuthFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    city: '',
  });

  const isSignUp = mode === 'signup';
  const isCourier = role === 'courier';
  
  const title = isSignUp 
    ? `Регистрация ${isCourier ? 'Курьера' : 'Ресторана'}`
    : `Вход ${isCourier ? 'Курьера' : 'Ресторана'}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isSignUp) {
        // Register user
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            role,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Ошибка регистрации');
        }

        // After successful registration, sign in
        const result = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          callbackUrl: isCourier ? '/courier' : '/restaurant',
          redirect: true,
        });

        if (result?.error) {
          throw new Error('Ошибка входа после регистрации');
        }
      } else {
        // Sign in
        const result = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          callbackUrl: isCourier ? '/courier' : '/restaurant',
          redirect: true,
        });

        if (result?.error) {
          throw new Error('Неверный email или пароль');
        }
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Произошла ошибка');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад к выбору роли
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
              isCourier 
                ? 'bg-blue-100 dark:bg-blue-900' 
                : 'bg-purple-100 dark:bg-purple-900'
            }`}>
              {isCourier ? (
                <UserCheck className={`w-8 h-8 ${isCourier ? 'text-blue-600' : 'text-purple-600'}`} />
              ) : (
                <Building2 className={`w-8 h-8 ${isCourier ? 'text-blue-600' : 'text-purple-600'}`} />
              )}
            </div>
            <CardTitle className="text-2xl">{title}</CardTitle>
            <CardDescription>
              {isSignUp 
                ? `Создайте аккаунт ${isCourier ? 'курьера' : 'ресторана'}`
                : `Войдите в свой аккаунт ${isCourier ? 'курьера' : 'ресторана'}`
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Введите пароль"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {isSignUp && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Имя</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder={isCourier ? "Ваше имя" : "Название ресторана"}
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Телефон</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+7 (999) 123-45-67"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">Город</Label>
                    <Input
                      id="city"
                      name="city"
                      type="text"
                      placeholder="Ваш город"
                      value={formData.city}
                      onChange={handleChange}
                    />
                  </div>
                </>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? 'Загрузка...' : (isSignUp ? 'Зарегистрироваться' : 'Войти')}
              </Button>

              <div className="text-center text-sm">
                {isSignUp ? (
                  <p>
                    Уже есть аккаунт?{' '}
                    <Link 
                      href={`/auth/signin/${role}`} 
                      className="text-primary hover:underline"
                    >
                      Войти
                    </Link>
                  </p>
                ) : (
                  <p>
                    Нет аккаунта?{' '}
                    <Link 
                      href={`/auth/signup/${role}`} 
                      className="text-primary hover:underline"
                    >
                      Зарегистрироваться
                    </Link>
                  </p>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Demo Account Info */}
        {!isSignUp && (
          <Card className="mt-4">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground text-center mb-2">
                Демо-аккаунт для тестирования:
              </p>
              <p className="text-xs text-center font-mono bg-muted p-2 rounded">
                Email: john@doe.com<br />
                Пароль: johndoe123
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
