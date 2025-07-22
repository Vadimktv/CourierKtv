
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Truck, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState<Array<{ id: string; name: string; region: string }>>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    cityId: '',
  });

  const loadCities = async () => {
    if (cities.length > 0) return;
    
    setLoadingCities(true);
    try {
      const response = await fetch('/api/cities');
      if (response.ok) {
        const data = await response.json();
        setCities(data);
      }
    } catch (error) {
      toast.error('Ошибка загрузки городов');
    } finally {
      setLoadingCities(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Login
        const result = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (result?.error) {
          toast.error('Неверный email или пароль');
        } else {
          toast.success('Вход выполнен успешно!');
          router.push('/');
        }
      } else {
        // Register
        if (!formData.name || !formData.cityId) {
          toast.error('Заполните все обязательные поля');
          return;
        }

        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          toast.success('Регистрация успешна! Выполняем вход...');
          
          // Auto login after registration
          const result = await signIn('credentials', {
            email: formData.email,
            password: formData.password,
            redirect: false,
          });

          if (!result?.error) {
            router.push('/');
          }
        } else {
          const error = await response.json();
          toast.error(error.message || 'Ошибка регистрации');
        }
      }
    } catch (error) {
      toast.error('Произошла ошибка. Попробуйте еще раз');
    } finally {
      setLoading(false);
    }
  };

  const handleModeChange = (login: boolean) => {
    setIsLogin(login);
    if (!login) {
      loadCities();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Truck className="h-8 w-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">CourierKtv</CardTitle>
              <p className="text-sm text-muted-foreground">Помощник курьера</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex bg-muted rounded-lg p-1 mb-6">
            <Button
              variant={isLogin ? "default" : "ghost"}
              size="sm"
              className="flex-1"
              onClick={() => handleModeChange(true)}
            >
              Вход
            </Button>
            <Button
              variant={!isLogin ? "default" : "ghost"}
              size="sm"
              className="flex-1"
              onClick={() => handleModeChange(false)}
            >
              Регистрация
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Имя</Label>
                <Input
                  id="name"
                  placeholder="Введите ваше имя"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required={!isLogin}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Введите ваш email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Введите пароль"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="city">Город работы</Label>
                <Select
                  value={formData.cityId}
                  onValueChange={(value) => setFormData({ ...formData, cityId: value })}
                  required={!isLogin}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите город" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingCities ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : (
                      cities.map((city) => (
                        <SelectItem key={city.id} value={city.id}>
                          {city.name}, {city.region}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isLogin ? 'Вход...' : 'Регистрация...'}
                </>
              ) : (
                isLogin ? 'Войти' : 'Зарегистрироваться'
              )}
            </Button>
          </form>

          {isLogin && (
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground text-center">
                <strong>Демо-аккаунт:</strong><br />
                Email: john@doe.com<br />
                Пароль: johndoe123
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
