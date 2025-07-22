
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserCheck, Building2, ArrowRight } from 'lucide-react';

export function RoleSelection() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<'courier' | 'restaurant' | null>(null);

  const handleRoleSelect = (role: 'courier' | 'restaurant') => {
    setSelectedRole(role);
    // Navigate to the appropriate sign-in page
    router.push(`/auth/signin/${role}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-xl text-muted-foreground">
            Выберите способ входа в систему
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          {/* Courier Card */}
          <Card 
            className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 hover:border-blue-300"
            onClick={() => handleRoleSelect('courier')}
          >
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <UserCheck className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl text-blue-600">Курьер</CardTitle>
              <CardDescription className="text-base">
                Анализируйте чеки, управляйте заказами и отслеживайте статистику доставок
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <ul className="text-sm text-muted-foreground space-y-2 mb-6">
                <li>• Анализ чеков с извлечением данных</li>
                <li>• Построение маршрутов доставки</li>
                <li>• Отслеживание заработка и статистики</li>
                <li>• Управление сменами</li>
              </ul>
              <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-black" variant="default">
                Войти
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Restaurant Card */}
          <Card 
            className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 hover:border-purple-300"
            onClick={() => handleRoleSelect('restaurant')}
          >
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                <Building2 className="w-8 h-8 text-purple-600" />
              </div>
              <CardTitle className="text-2xl text-purple-600">Ресторан</CardTitle>
              <CardDescription className="text-base">
                Просматривайте заказы от курьеров и управляйте меню вашего заведения
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <ul className="text-sm text-muted-foreground space-y-2 mb-6">
                <li>• Просмотр заказов от курьеров</li>
                <li>• Управление меню и позициями</li>
                <li>• Статистика по заказам</li>
                <li>• Связь с курьерами</li>
              </ul>
              <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-black" variant="outline">
                Войти
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground">
            Нет аккаунта? Создайте его при входе в выбранную роль
          </p>
        </div>
      </div>
    </div>
  );
}
