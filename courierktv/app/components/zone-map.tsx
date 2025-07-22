
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Map,
  MapPin,
  Search,
  Loader2,
  Info
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface ZoneMapProps {
  user: any;
}

export function ZoneMap({ user }: ZoneMapProps) {
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchAddress, setSearchAddress] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);

  useEffect(() => {
    if (user?.city?.name === 'Геленджик') {
      fetchZones();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchZones = async () => {
    try {
      const response = await fetch(`/api/zones?cityId=${user.city.id}`);
      if (response.ok) {
        const data = await response.json();
        setZones(data);
      }
    } catch (error) {
      console.error('Error fetching zones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchAddress = async () => {
    if (!searchAddress.trim()) return;

    try {
      const response = await fetch('/api/zones/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address: searchAddress }),
      });

      if (response.ok) {
        const result = await response.json();
        setSearchResult(result);
      }
    } catch (error) {
      console.error('Error searching address:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user?.city?.name !== 'Геленджик') {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Карта зон</h1>
        </div>

        <Card>
          <CardContent className="p-12 text-center">
            <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
              <Map className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Зоны не настроены</h3>
            <p className="text-muted-foreground">
              Карта зон с тарификацией доступна только для города Геленджик.
              <br />
              В вашем городе ({user?.city?.name}) используется единый тариф.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Карта зон Геленджика</h1>
        <p className="text-muted-foreground">
          Тарификация заработка по зонам доставки
        </p>
      </div>

      {/* Address Search */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Поиск зоны по адресу
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Введите адрес для определения зоны"
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearchAddress()}
              className="flex-1"
            />
            <Button onClick={handleSearchAddress}>
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {searchResult && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="font-semibold">Результат поиска:</span>
              </div>
              <p className="text-sm mb-2">{searchResult.address}</p>
              {searchResult.zone ? (
                <div className="flex items-center gap-2">
                  <Badge 
                    style={{ backgroundColor: searchResult.zone.color }}
                    className="text-white"
                  >
                    {searchResult.zone.name}
                  </Badge>
                  <span className="text-sm">
                    Тариф: {formatCurrency(searchResult.zone.rate)} за заказ
                  </span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Зона не определена для данного адреса
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Map Placeholder */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5" />
            Интерактивная карта
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Map className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold mb-2">Карта Яндекс</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Здесь будет отображена интерактивная карта зон Геленджика
              </p>
              <Button variant="outline" size="sm" asChild>
                <a 
                  href="https://yandex.ru/maps/10990/gelendgik/house/ulitsa_michurina_22/Z0EYdg5iQEMGQFpufXl0dHlqZQ==/?ll=38.087108%2C44.554043&source=constructorLink&um=constructor%3A257dfdc424fa5fb9386da17f75e3d9c87a22ae6147e3a1c49cfc2adfe209d9e8&z=11.97"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Открыть в Яндекс Картах
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Zone Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Тарифы по зонам
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {zones.map((zone) => (
              <div 
                key={zone.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: zone.color }}
                  />
                  <div>
                    <h4 className="font-semibold">{zone.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Зона доставки
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">
                    {formatCurrency(zone.rate)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    за заказ
                  </p>
                </div>
              </div>
            ))}
          </div>

          {zones.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              Зоны не загружены
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
