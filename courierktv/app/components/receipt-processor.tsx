
'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  X,
  Upload,
  Camera,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Save,
  Banknote,
  CreditCard,
  Smartphone,
  Building2,
} from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

interface ReceiptProcessorProps {
  onClose: () => void;
  onReceiptProcessed: () => void;
}

export function ReceiptProcessor({ onClose, onReceiptProcessed }: ReceiptProcessorProps) {
  const [step, setStep] = useState<'upload' | 'processing' | 'edit'>('upload');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [hasHandwrittenSum, setHasHandwrittenSum] = useState(false);
  const [formData, setFormData] = useState({
    restaurant: '',
    fullAddress: '',
    phoneNumber: '',
    totalAmount: '',
    paymentMethod: '',
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Файл слишком большой. Максимальный размер 5МБ');
        return;
      }
      
      setUploadedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      processReceipt(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg'],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
  });

  const processReceipt = async (file: File) => {
    setStep('processing');
    setLoading(true);

    try {
      // Simulate OCR processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock extracted data with some Russian examples
      const mockData = {
        restaurant: 'Суши Мастер',
        fullAddress: 'ул. Мичурина, 22, кв. 15',
        phoneNumber: '+79610062477,44660',
        totalAmount: '1250',
        paymentMethod: 'cash',
        hasHandwrittenSum: Math.random() > 0.7, // 30% chance of handwritten sum
      };

      setFormData(mockData);
      setHasHandwrittenSum(mockData.hasHandwrittenSum);
      setStep('edit');
    } catch (error) {
      toast.error('Ошибка обработки чека. Попробуйте еще раз');
      setStep('upload');
    } finally {
      setLoading(false);
    }
  };

  const handleRetryProcessing = () => {
    if (uploadedFile) {
      processReceipt(uploadedFile);
    }
  };

  const handleSave = async () => {
    if (!formData.fullAddress || !formData.totalAmount || !formData.paymentMethod) {
      toast.error('Заполните все обязательные поля');
      return;
    }

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      if (uploadedFile) {
        formDataToSend.append('image', uploadedFile);
      }
      formDataToSend.append('data', JSON.stringify({
        ...formData,
        totalAmount: parseFloat(formData.totalAmount),
        hasHandwrittenSum,
      }));

      const response = await fetch('/api/receipts', {
        method: 'POST',
        body: formDataToSend,
      });

      if (response.ok) {
        toast.success('Чек успешно сохранен!');
        onReceiptProcessed();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Ошибка сохранения чека');
      }
    } catch (error) {
      toast.error('Произошла ошибка. Попробуйте еще раз');
    } finally {
      setLoading(false);
    }
  };

  const paymentMethods = [
    { value: 'cash', label: 'Наличные', icon: Banknote, color: 'text-green-500' },
    { value: 'card', label: 'Карта', icon: CreditCard, color: 'text-blue-500' },
    { value: 'transfer', label: 'Перевод', icon: Smartphone, color: 'text-purple-500' },
    { value: 'terminal', label: 'Терминал', icon: Building2, color: 'text-orange-500' },
  ];

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-y-auto">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Обработка чека</h1>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Upload Step */}
        {step === 'upload' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Загрузка чека
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-primary bg-primary/10'
                    : 'border-muted-foreground hover:border-primary'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">
                  {isDragActive ? 'Отпустите файл здесь' : 'Загрузите фото чека'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  Перетащите изображение или нажмите для выбора
                </p>
                <div className="flex items-center justify-center gap-4">
                  <Button variant="outline" size="sm">
                    <Camera className="mr-2 h-4 w-4" />
                    Камера
                  </Button>
                  <Button variant="outline" size="sm">
                    <Upload className="mr-2 h-4 w-4" />
                    Галерея
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  Поддерживаются JPG, PNG (до 5МБ)
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Processing Step */}
        {step === 'processing' && (
          <Card>
            <CardContent className="p-8 text-center">
              <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
              <h3 className="text-lg font-semibold mb-2">Обрабатываем чек...</h3>
              <p className="text-muted-foreground">
                Извлекаем данные с помощью ИИ. Это займет несколько секунд.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Edit Step */}
        {step === 'edit' && (
          <div className="space-y-6">
            {/* Preview */}
            {previewUrl && (
              <Card>
                <CardHeader>
                  <CardTitle>Превью чека</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative aspect-[3/4] max-w-sm mx-auto bg-muted rounded-lg overflow-hidden">
                    <Image
                      src={previewUrl}
                      alt="Превью чека"
                      fill
                      className="object-cover"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Warnings */}
            {hasHandwrittenSum && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Обнаружена рукописная сумма. Пожалуйста, проверьте корректность распознавания.
                </AlertDescription>
              </Alert>
            )}

            {/* Form */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Данные чека</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRetryProcessing}
                    disabled={loading}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Распознать заново
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="restaurant">Ресторан</Label>
                  <Input
                    id="restaurant"
                    placeholder="Название ресторана"
                    value={formData.restaurant}
                    onChange={(e) => setFormData({ ...formData, restaurant: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Адрес доставки *</Label>
                  <Textarea
                    id="address"
                    placeholder="Полный адрес доставки"
                    value={formData.fullAddress}
                    onChange={(e) => setFormData({ ...formData, fullAddress: e.target.value })}
                    className="min-h-20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Номер телефона</Label>
                  <Input
                    id="phone"
                    placeholder="+79610062477,44660"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Формат: +7XXXXXXXXXX,добавочный (если есть)
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Сумма заказа *</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0"
                      value={formData.totalAmount}
                      onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Способ оплаты *</Label>
                    <Select
                      value={formData.paymentMethod}
                      onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите способ" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map((method) => {
                          const Icon = method.icon;
                          return (
                            <SelectItem key={method.value} value={method.value}>
                              <div className="flex items-center gap-2">
                                <Icon className={`h-4 w-4 ${method.color}`} />
                                {method.label}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Payment method buttons for quick selection */}
                <div className="space-y-2">
                  <Label>Быстрый выбор способа оплаты</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {paymentMethods.map((method) => {
                      const Icon = method.icon;
                      const isSelected = formData.paymentMethod === method.value;
                      return (
                        <Button
                          key={method.value}
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFormData({ ...formData, paymentMethod: method.value })}
                          className="justify-start"
                        >
                          <Icon className={`mr-2 h-4 w-4 ${isSelected ? 'text-white' : method.color}`} />
                          {method.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
              <Button onClick={onClose} variant="outline" className="flex-1">
                Отмена
              </Button>
              <Button onClick={handleSave} disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Сохранить чек
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
