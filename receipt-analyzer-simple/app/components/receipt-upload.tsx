
'use client'

import { useState, useRef } from 'react'
import { Camera, Upload, X, ArrowLeft, AlertCircle, Zap, FileImage, Sparkles } from 'lucide-react'

interface ReceiptUploadProps {
  onClose: () => void
  onOrderCreated: () => void
}

export function ReceiptUpload({ onClose, onOrderCreated }: ReceiptUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file)
      setError('')
      
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setError('Пожалуйста, выберите изображение')
    }
  }

  const handleCameraCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleAnalyze = async () => {
    if (!selectedFile) return

    setAnalyzing(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('receipt', selectedFile)

      const response = await fetch('/api/receipt/analyze', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        // Создаем заказ с распознанными данными
        const orderResponse = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address: data.address,
            phone: data.phone,
            amount: data.amount,
            zone: data.zone,
            earnings: data.earnings,
            receiptUrl: previewUrl
          }),
        })

        if (orderResponse.ok) {
          onOrderCreated()
        } else {
          setError('Ошибка при создании заказа')
        }
      } else {
        setError(data.error || 'Ошибка при обработке чека')
      }
    } catch (err) {
      setError('Произошла ошибка. Попробуйте еще раз.')
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-6 max-w-md">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8 animate-fade-in">
          <button
            onClick={onClose}
            className="w-10 h-10 bg-card border border-border rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Загрузка чека
            </h1>
            <p className="text-sm text-muted-foreground">
              Сканируем и анализируем автоматически
            </p>
          </div>
        </div>

        {/* File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Preview */}
        {previewUrl && (
          <div className="mb-8 animate-fade-in">
            <div className="relative bg-gradient-to-br from-card to-card/80 border border-border rounded-2xl overflow-hidden">
              <div className="p-4">
                <img
                  src={previewUrl}
                  alt="Предпросмотр чека"
                  className="receipt-preview w-full mx-auto"
                />
              </div>
              <button
                onClick={() => {
                  setSelectedFile(null)
                  setPreviewUrl(null)
                }}
                className="absolute top-3 right-3 w-8 h-8 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/80 transition-colors"
              >
                <X size={16} />
              </button>
              <div className="absolute top-3 left-3 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                ✓ Готов к анализу
              </div>
            </div>
          </div>
        )}

        {/* Upload Buttons */}
        {!selectedFile && (
          <div className="space-y-4 mb-8 animate-slide-in">
            <button
              onClick={handleCameraCapture}
              className="btn-primary w-full flex items-center justify-center space-x-3 py-6"
            >
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Camera size={20} />
              </div>
              <div className="text-left">
                <div className="font-semibold">Сфотографировать чек</div>
                <div className="text-sm opacity-80">Быстро и точно</div>
              </div>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-secondary w-full flex items-center justify-center space-x-3 py-6"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
                <Upload size={20} className="text-white" />
              </div>
              <div className="text-left">
                <div className="font-semibold">Выбрать из галереи</div>
                <div className="text-sm text-muted-foreground">Загрузить готовое фото</div>
              </div>
            </button>
          </div>
        )}

        {/* Analyze Button */}
        {selectedFile && (
          <div className="mb-8 animate-fade-in">
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="btn-primary w-full flex items-center justify-center space-x-3 py-6"
            >
              {analyzing ? (
                <>
                  <div className="loading-spinner" />
                  <div className="text-left">
                    <div className="font-semibold">Анализируем чек...</div>
                    <div className="text-sm opacity-80">Это займет несколько секунд</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <Zap size={20} />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Распознать чек</div>
                    <div className="text-sm opacity-80">ИИ анализ данных</div>
                  </div>
                </>
              )}
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-8 animate-slide-in">
            <div className="bg-gradient-to-r from-red-500/20 to-red-600/20 border-2 border-red-500/30 rounded-2xl p-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <AlertCircle className="text-white" size={16} />
                </div>
                <div>
                  <div className="font-semibold text-red-400 mb-1">Ошибка</div>
                  <div className="text-sm text-red-300">{error}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="stats-card mb-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
              <Sparkles className="text-white" size={16} />
            </div>
            <h3 className="font-bold text-foreground">
              Советы для качественного сканирования
            </h3>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2" />
              <span className="text-sm text-muted-foreground">
                Полный чек в кадре
              </span>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2" />
              <span className="text-sm text-muted-foreground">
                Хорошее освещение
              </span>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2" />
              <span className="text-sm text-muted-foreground">
                Камера параллельно
              </span>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2" />
              <span className="text-sm text-muted-foreground">
                Без бликов
              </span>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-3 animate-slide-in" style={{ animationDelay: '0.3s' }}>
          <div className="text-center p-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Zap className="text-white" size={16} />
            </div>
            <div className="text-xs font-medium text-foreground">Быстро</div>
            <div className="text-xs text-muted-foreground">2-3 секунды</div>
          </div>
          
          <div className="text-center p-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-2">
              <FileImage className="text-white" size={16} />
            </div>
            <div className="text-xs font-medium text-foreground">Точно</div>
            <div className="text-xs text-muted-foreground">ИИ анализ</div>
          </div>
          
          <div className="text-center p-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Sparkles className="text-white" size={16} />
            </div>
            <div className="text-xs font-medium text-foreground">Удобно</div>
            <div className="text-xs text-muted-foreground">Автоматом</div>
          </div>
        </div>
      </div>
    </div>
  )
}
