
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Upload, MapPin, Phone, DollarSign, CreditCard, Loader2, Camera } from 'lucide-react';

interface Zone {
  id: string;
  name: string;
  rate: number;
  color: string;
}

interface AddOrderFormProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderAdded: () => void;
}

export function AddOrderForm({ isOpen, onClose, onOrderAdded }: AddOrderFormProps) {
  const [formData, setFormData] = useState({
    address: '',
    phone: '',
    amount: '',
    paymentMethod: '',
    zoneId: ''
  });
  const [zones, setZones] = useState<Zone[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingReceipt, setIsProcessingReceipt] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchZones();
    }
  }, [isOpen]);

  const fetchZones = async () => {
    try {
      const response = await fetch('/api/zones');
      if (response.ok) {
        const data = await response.json();
        setZones(data.zones || []);
      }
    } catch (error) {
      console.error('Error fetching zones:', error);
    }
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingReceipt(true);
    setError('');

    // Имитация OCR обработки
    setTimeout(() => {
      // Имитируем извлечение данных из чека
      const mockData = {
        address: 'ул. Примерная, д. 123, кв. 45',
        phone: '+7 (XXX) XXX-XX-XX',
        amount: (Math.random() * 2000 + 500).toFixed(0)
      };

      setFormData(prev => ({
        ...prev,
        address: mockData.address,
        phone: mockData.phone,
        amount: mockData.amount
      }));

      setIsProcessingReceipt(false);
    }, 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!formData.address || !formData.amount || !formData.paymentMethod) {
      setError('Адрес, сумма и способ оплаты обязательны');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setFormData({
          address: '',
          phone: '',
          amount: '',
          paymentMethod: '',
          zoneId: ''
        });
        onOrderAdded();
        onClose();
      } else {
        const data = await response.json();
        setError(data.error || 'Ошибка при создании заказа');
      }
    } catch (error) {
      setError('Ошибка при создании заказа');
    } finally {
      setIsLoading(false);
    }
  };

  const paymentMethods = [
    { value: 'CASH', label: 'Наличные' },
    { value: 'CARD', label: 'Карта' },
    { value: 'TRANSFER', label: 'Перевод' },
    { value: 'TERMINAL', label: 'Терминал' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold">Добавить заказ</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Upload Receipt */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Загрузить чек (OCR)</label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleReceiptUpload}
                className="hidden"
                id="receipt-upload"
                disabled={isProcessingReceipt}
              />
              <label
                htmlFor="receipt-upload"
                className={`flex items-center justify-center h-24 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors ${
                  isProcessingReceipt ? 'pointer-events-none opacity-50' : ''
                }`}
              >
                {isProcessingReceipt ? (
                  <div className="flex items-center space-x-2 text-primary">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm">Обработка...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <Camera className="h-5 w-5" />
                    <span className="text-sm">Сфотографировать чек</span>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="relative">
              <MapPin className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Адрес доставки"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="pl-12"
                required
                disabled={isLoading}
              />
            </div>

            <div className="relative">
              <Phone className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Телефон (необязательно)"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="pl-12"
                disabled={isLoading}
              />
            </div>

            <div className="relative">
              <DollarSign className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
              <Input
                type="number"
                placeholder="Сумма заказа"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="pl-12"
                required
                disabled={isLoading}
              />
            </div>

            <div className="relative">
              <CreditCard className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground z-10" />
              <Select
                value={formData.paymentMethod}
                onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                disabled={isLoading}
              >
                <SelectTrigger className="pl-12">
                  <SelectValue placeholder="Способ оплаты" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select
                value={formData.zoneId}
                onValueChange={(value) => setFormData({ ...formData, zoneId: value })}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите зону" />
                </SelectTrigger>
                <SelectContent>
                  {zones.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{zone.name}</span>
                        <span className="text-primary font-medium ml-2">+{zone.rate}₽</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex space-x-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Отмена
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Добавление...
                </>
              ) : (
                'Добавить заказ'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
