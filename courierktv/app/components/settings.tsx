
'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User,
  MapPin,
  MessageSquare,
  Palette,
  LogOut,
  Save,
  Loader2,
  ExternalLink,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

interface SettingsProps {
  user: any;
  onUserUpdate: (user: any) => void;
}

export function Settings({ user, onUserUpdate }: SettingsProps) {
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState<any[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    cityId: user?.cityId || '',
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

  const handleSaveProfile = async () => {
    if (!formData.name.trim()) {
      toast.error('Имя обязательно для заполнения');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        onUserUpdate(updatedUser);
        toast.success('Профиль обновлен!');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Ошибка обновления профиля');
      }
    } catch (error) {
      toast.error('Произошла ошибка. Попробуйте еще раз');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut({ callbackUrl: '/' });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Настройки</h1>
        <p className="text-muted-foreground">
          Управление профилем и настройками приложения
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Профиль пользователя
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={user?.email || ''}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email нельзя изменить
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Имя</Label>
              <Input
                id="name"
                placeholder="Введите ваше имя"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Город работы</Label>
              <Select
                value={formData.cityId}
                onValueChange={(value) => setFormData({ ...formData, cityId: value })}
                onOpenChange={(open) => open && loadCities()}
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

            <Button 
              onClick={handleSaveProfile} 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Сохранение...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Сохранить изменения
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Zone Info */}
        {user?.city?.name && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Информация о зонах
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">Текущий город: {user.city.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {user.city.name === 'Геленджик' 
                      ? 'Доступна система зон с тарификацией'
                      : 'Используется единый тариф для всех заказов'
                    }
                  </p>
                </div>
                {user.city.name === 'Геленджик' && (
                  <Badge variant="secondary">Зоны активны</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Telegram Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Интеграция с Telegram
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Подключите Telegram бот для удобной работы с чеками через мессенджер.
                Вы сможете отправлять фото чеков прямо в бот и получать обработанные данные.
              </AlertDescription>
            </Alert>

            {user?.telegramId ? (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-green-700">Telegram подключен</p>
                    <p className="text-sm text-green-600">
                      ID: {user.telegramId}
                      {user.telegramUsername && ` (@${user.telegramUsername})`}
                    </p>
                  </div>
                  <Badge className="bg-green-500">Активен</Badge>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Для подключения Telegram бота:
                </p>
                <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                  <li>Найдите бота @CourierKtvBot в Telegram</li>
                  <li>Отправьте команду /start</li>
                  <li>Следуйте инструкциям для привязки аккаунта</li>
                </ol>
                <Button variant="outline" className="w-full" asChild>
                  <a 
                    href="https://t.me/CourierKtvBot" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Открыть бота в Telegram
                  </a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* App Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Настройки приложения
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Темная тема</p>
                  <p className="text-sm text-muted-foreground">
                    Включена для экономии батареи
                  </p>
                </div>
                <Badge variant="secondary">Активна</Badge>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Настройки оформления чеков</p>
                  <p className="text-sm text-muted-foreground">
                    Дополнительные параметры обработки
                  </p>
                </div>
                <Button variant="outline" size="sm" disabled>
                  Скоро
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        {user?._count && (
          <Card>
            <CardHeader>
              <CardTitle>Статистика</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{user._count.shifts}</p>
                  <p className="text-sm text-muted-foreground">Смен</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{user._count.receipts}</p>
                  <p className="text-sm text-muted-foreground">Чеков</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sign Out */}
        <Card>
          <CardContent className="pt-6">
            <Button 
              onClick={handleSignOut}
              variant="destructive" 
              className="w-full"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Выйти из аккаунта
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
