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
  Sparkles,
  Lightbulb,
} from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import type { ReceiptAnalysisSource, ReceiptDetectedFields } from '@/lib/types';

interface ReceiptProcessorProps {
  onClose: () => void;
  onReceiptProcessed: () => void;
}

const createInitialDetectedFields = (): ReceiptDetectedFields => ({
  restaurant: false,
  fullAddress: false,
  phoneNumber: false,
  totalAmount: false,
  paymentMethod: false,
});

const DETECTED_FIELD_LABELS: Record<keyof ReceiptDetectedFields, string> = {
  restaurant: 'Ресторан',
  fullAddress: 'Адрес',
  phoneNumber: 'Телефон',
  totalAmount: 'Сумма',
  paymentMethod: 'Оплата',
};

export function ReceiptProcessor({ onClose, onReceiptProcessed }: ReceiptProcessorProps) {
  const [step, setStep] = useState<'upload' | 'processing' | 'edit'>('upload');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [hasHandwrittenSum, setHasHandwrittenSum] = useState(false);
  const [rawText, setRawText] = useState('');
  const [analysisWarnings, setAnalysisWarnings] = useState<string[]>([]);
  const [analysisSuggestions, setAnalysisSuggestions] = useState<string[]>([]);
  const [analysisConfidence, setAnalysisConfidence] = useState<number | null>(null);
  const [analysisSource, setAnalysisSource] = useState<ReceiptAnalysisSource | null>(null);
  const [detectedFields, setDetectedFields] = useState<ReceiptDetectedFields>(() =>
    createInitialDetectedFields()
  );
  const [formData, setFormData] = useState({
    restaurant: '',
    fullAddress: '',
    phoneNumber: '',
    totalAmount: '',
    paymentMethod: '',
  });

  const processReceipt = useCallback(
    async ({ file, text }: { file?: File; text?: string }) => {
      if (!file && !text) {
        toast.error('Загрузите чек или добавьте текст для распознавания');
        return;
      }

      setAnalysisWarnings([]);
      setAnalysisSuggestions([]);
      setAnalysisConfidence(null);
      setAnalysisSource(null);
      setDetectedFields(createInitialDetectedFields());
      setHasHandwrittenSum(false);
      setRawText(text ?? '');
      setStep('processing');
      setLoading(true);

      try {
        const formDataToSend = new FormData();
        if (file) {
          formDataToSend.append('file', file);
        }
        if (text) {
          formDataToSend.append('text', text);
        }

        const response = await fetch('/api/receipts/analyze', {
          method: 'POST',
          body: formDataToSend,
        });

        if (!response.ok) {
          const error = await response.json().catch(() => null);
          const message = error?.message || 'Не удалось обработать чек. Заполните данные вручную.';
          toast.error(message);
          setAnalysisWarnings([message]);
          setStep('edit');
          return;
        }

        const result = await response.json();
        const composedPhone = result.phoneNumber
          ? result.additionalNumber
            ? `${result.phoneNumber},${result.additionalNumber}`
            : result.phoneNumber
          : '';

        setFormData({
          restaurant: result.restaurant || '',
          fullAddress: result.fullAddress || '',
          phoneNumber: composedPhone,
          totalAmount: result.totalAmount ? String(result.totalAmount) : '',
          paymentMethod: result.paymentMethod || '',
        });
        setHasHandwrittenSum(Boolean(result.hasHandwrittenSum));
        setRawText(result.rawText || text || '');
        setAnalysisWarnings(Array.isArray(result.warnings) ? result.warnings : []);
        setAnalysisSuggestions(Array.isArray(result.suggestions) ? result.suggestions : []);
        setAnalysisConfidence(
          typeof result.confidence === 'number'
            ? Math.min(1, Math.max(0, result.confidence))
            : null
        );
        setAnalysisSource(result.source ?? (file ? 'file' : text ? 'text' : null));
        setDetectedFields(
          result.detectedFields
            ? {
                restaurant: Boolean(result.detectedFields.restaurant),
                fullAddress: Boolean(result.detectedFields.fullAddress),
                phoneNumber: Boolean(result.detectedFields.phoneNumber),
                totalAmount: Boolean(result.detectedFields.totalAmount),
                paymentMethod: Boolean(result.detectedFields.paymentMethod),
              }
            : createInitialDetectedFields()
        );
        setStep('edit');
      } catch (error) {
        console.error('Receipt analysis error:', error);
        toast.error('Ошибка обработки чека. Попробуйте еще раз');
        setStep('edit');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) {
        return;
      }

      const file = acceptedFiles[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Файл слишком большой. Максимальный размер 5МБ');
        return;
      }

      setUploadedFile(file);

      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        setPreviewUrl('');
      }

      processReceipt({ file });
    },
    [processReceipt]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
  });

  const handleRetryProcessing = () => {
    if (rawText.trim()) {
      processReceipt({ text: rawText });
    } else if (uploadedFile) {
      processReceipt({ file: uploadedFile });
    } else {
      toast.error('Добавьте файл чека или вставьте текст для распознавания');
    }
  };

  const handleManualMode = () => {
    setUploadedFile(null);
    setPreviewUrl('');
    setRawText('');
    setFormData({
      restaurant: '',
      fullAddress: '',
      phoneNumber: '',
      totalAmount: '',
      paymentMethod: '',
    });
    setAnalysisWarnings([]);
    setAnalysisSuggestions([]);
    setAnalysisConfidence(null);
    setAnalysisSource(null);
    setDetectedFields(createInitialDetectedFields());
    setHasHandwrittenSum(false);
    setStep('edit');
  };

  const handleReanalyzeText = () => {
    if (!rawText.trim()) {
      toast.error('Добавьте текст чека перед повторным распознаванием');
      return;
    }

    processReceipt({ text: rawText });
  };

  const handleSave = async () => {
    if (!formData.fullAddress || !formData.totalAmount || !formData.paymentMethod) {
      toast.error('Заполните все обязательные поля');
      return;
    }

    const parsedAmount = Number.parseFloat(formData.totalAmount);
    if (Number.isNaN(parsedAmount)) {
      toast.error('Сумма заказа указана некорректно');
      return;
    }

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      if (uploadedFile) {
        formDataToSend.append('image', uploadedFile);
      }
      formDataToSend.append(
        'data',
        JSON.stringify({
          ...formData,
          totalAmount: parsedAmount,
          hasHandwrittenSum,
        })
      );

      const response = await fetch('/api/receipts', {
        method: 'POST',
        body: formDataToSend,
      });

      if (response.ok) {
        toast.success('Чек успешно сохранен!');
        onReceiptProcessed();
      } else {
        const error = await response.json().catch(() => null);
        toast.error(error?.message || 'Ошибка сохранения чека');
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

  const hasAnalysis =
    analysisConfidence !== null ||
    analysisWarnings.length > 0 ||
    analysisSuggestions.length > 0 ||
    Object.values(detectedFields).some(Boolean);

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
                    : 'border-muted-foreground/40 hover:border-primary'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">
                  {isDragActive ? 'Отпустите файл здесь' : 'Загрузите чек или текстовый файл'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  Перетащите изображение или текстовый файл чека, либо нажмите для выбора
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
                  Поддерживаются JPG, PNG и TXT (до 5&nbsp;МБ)
                </p>
              </div>
              <div className="mt-4 text-center">
                <Button variant="ghost" size="sm" onClick={handleManualMode}>
                  Заполнить данные вручную
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Processing Step */}
        {step === 'processing' && (
          <Card>
            <CardContent className="p-8 text-center">
              <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
              <h3 className="text-lg font-semibold mb-2">Анализируем чек...</h3>
              <p className="text-muted-foreground">
                Извлекаем адрес, сумму и контакты. Обычно это занимает не более пары секунд.
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

            {/* Analysis summary */}
            {hasAnalysis && (
              <Card>
                <CardHeader>
                  <CardTitle>Результаты распознавания</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {analysisConfidence !== null && (
                      <Badge variant="outline" className="bg-primary/10 border-primary/30 text-primary">
                        Точность распознавания: {Math.round(analysisConfidence * 100)}%
                      </Badge>
                    )}
                    {analysisSource && (
                      <Badge variant="outline" className="bg-muted">
                        Источник: {analysisSource === 'file' ? 'файл' : 'текст'}
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(DETECTED_FIELD_LABELS).map(([key, label]) => {
                      const detected = detectedFields[key as keyof ReceiptDetectedFields];
                      return (
                        <Badge
                          key={key}
                          variant={detected ? 'default' : 'outline'}
                          className={detected ? '' : 'text-muted-foreground'}
                        >
                          {label}
                        </Badge>
                      );
                    })}
                  </div>
                  {analysisWarnings.map((warning, index) => (
                    <Alert
                      key={`${warning}-${index}`}
                      className="border-amber-200 bg-amber-50 text-amber-900"
                    >
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{warning}</AlertDescription>
                    </Alert>
                  ))}
                  {analysisSuggestions.length > 0 && (
                    <div className="space-y-2">
                      {analysisSuggestions.map((suggestion, index) => (
                        <div
                          key={`${suggestion}-${index}`}
                          className="flex items-center gap-2 text-sm text-muted-foreground"
                        >
                          <Lightbulb className="h-4 w-4 text-amber-500" />
                          <span>{suggestion}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {hasHandwrittenSum && !analysisWarnings.some((warning) => warning.includes('рукопис')) && (
                    <Alert className="border-amber-200 bg-amber-50 text-amber-900">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Обнаружена рукописная сумма. Пожалуйста, проверьте корректность распознавания.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Recognized text */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Распознанный текст</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReanalyzeText}
                    disabled={loading || !rawText.trim()}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Перераспознать текст
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Textarea
                  id="rawText"
                  placeholder="Вставьте текст чека или отредактируйте распознанный"
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  className="min-h-32 font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Если автоматическое распознавание сработало неверно, отредактируйте текст и попробуйте снова.
                </p>
              </CardContent>
            </Card>

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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                          variant={isSelected ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setFormData({ ...formData, paymentMethod: method.value })}
                          className="justify-start"
                        >
                          <Icon
                            className={`mr-2 h-4 w-4 ${isSelected ? 'text-white' : method.color}`}
                          />
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
