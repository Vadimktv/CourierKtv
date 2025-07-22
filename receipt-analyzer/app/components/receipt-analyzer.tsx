
'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { ReceiptText, UploadCloud, Map, History, Plus, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { UploadedFile, OrderData, DeliveryZoneData, ShiftData, OrderCompletionData } from '@/lib/types'
import { FileUploadZone } from '@/components/file-upload-zone'
import { OrderCard } from '@/components/order-card'
import { ProcessingProgress } from '@/components/processing-progress'
import { RouteBuilder } from '@/components/route-builder'
import { OrderTabs } from '@/components/order-tabs'
import { ShiftStatistics } from '@/components/shift-statistics'
import { OrderCompletionDialog } from '@/components/order-completion-dialog'
import { ZoneSettingsDialog } from '@/components/zone-settings-dialog'

export function ReceiptAnalyzer() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [activeOrders, setActiveOrders] = useState<OrderData[]>([])
  const [completedOrders, setCompletedOrders] = useState<OrderData[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [showAddMore, setShowAddMore] = useState(false)
  
  // New state for zones and shift management
  const [zones, setZones] = useState<DeliveryZoneData[]>([])
  const [currentShift, setCurrentShift] = useState<ShiftData | null>(null)
  const [showStatistics, setShowStatistics] = useState(false)
  
  // Dialog states
  const [showCompletionDialog, setShowCompletionDialog] = useState(false)
  const [showZoneSettings, setShowZoneSettings] = useState(false)
  const [selectedOrderForCompletion, setSelectedOrderForCompletion] = useState<OrderData | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Initialize data on component mount
  useEffect(() => {
    initializeData()
  }, [])

  const initializeData = async () => {
    try {
      // Initialize zones
      await fetch('/api/zones/seed', { method: 'POST' })
      
      // Load zones
      const zonesResponse = await fetch('/api/zones')
      const zonesData = await zonesResponse.json()
      setZones(zonesData)

      // Load current shift
      const shiftResponse = await fetch('/api/shifts/current')
      const shiftData = await shiftResponse.json()
      setCurrentShift(shiftData)

      // Load active orders
      const activeOrdersResponse = await fetch('/api/orders/active')
      const activeOrdersData = await activeOrdersResponse.json()
      setActiveOrders(activeOrdersData)

      // Load completed orders
      const completedOrdersResponse = await fetch('/api/orders/completed')
      const completedOrdersData = await completedOrdersResponse.json()
      setCompletedOrders(completedOrdersData)

    } catch (error) {
      console.error('Error initializing data:', error)
      toast({
        title: "Ошибка инициализации",
        description: "Не удалось загрузить данные приложения",
        variant: "destructive",
      })
    }
  }

  const handleFileUpload = useCallback(async (files: FileList) => {
    const validFiles = Array.from(files).filter(file => {
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
      const maxSize = 10 * 1024 * 1024 // 10MB
      
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Неподдерживаемый формат",
          description: `Файл ${file.name} имеет неподдерживаемый формат`,
          variant: "destructive",
        })
        return false
      }
      
      if (file.size > maxSize) {
        toast({
          title: "Файл слишком большой",
          description: `Файл ${file.name} превышает лимит 10MB`,
          variant: "destructive",
        })
        return false
      }
      
      return true
    })

    if (validFiles.length === 0) return

    const newFiles: UploadedFile[] = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      status: 'pending',
      progress: 0
    }))

    setUploadedFiles(prev => [...prev, ...newFiles])
    setShowAddMore(true)
    
    // Start processing
    await processFiles(newFiles)
  }, [toast])

  const processFiles = async (files: UploadedFile[]) => {
    setIsProcessing(true)
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      // Update status to processing
      setUploadedFiles(prev => 
        prev.map(f => 
          f.file.name === file.file.name 
            ? { ...f, status: 'processing', progress: 0 }
            : f
        )
      )

      try {
        // Simulate OCR processing with progress
        for (let progress = 0; progress <= 100; progress += 20) {
          await new Promise(resolve => setTimeout(resolve, 200))
          setUploadedFiles(prev => 
            prev.map(f => 
              f.file.name === file.file.name 
                ? { ...f, progress }
                : f
            )
          )
        }

        // Process with OCR API
        const orderData = await processReceiptWithOCR(file.file)
        
        setActiveOrders(prev => [...prev, orderData])
        setUploadedFiles(prev => 
          prev.map(f => 
            f.file.name === file.file.name 
              ? { ...f, status: 'completed', progress: 100 }
              : f
          )
        )

        toast({
          title: "Чек обработан",
          description: `Данные из ${file.file.name} успешно извлечены`,
        })

      } catch (error: any) {
        setUploadedFiles(prev => 
          prev.map(f => 
            f.file.name === file.file.name 
              ? { ...f, status: 'failed', progress: 0 }
              : f
          )
        )
        
        // Parse detailed error information
        let errorTitle = "Ошибка обработки"
        let errorDescription = `Не удалось обработать ${file.file.name}`
        let showRetryAction = true

        if (error?.details) {
          errorTitle = error.error || errorTitle
          errorDescription = error.details
        }

        toast({
          title: errorTitle,
          description: errorDescription,
          variant: "destructive",
          action: showRetryAction ? (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => retryFileProcessing(file)}
            >
              Обработать чек еще раз
            </Button>
          ) : undefined,
        })

        // Show detailed suggestions if available
        if (error?.suggestions && error.suggestions.length > 0) {
          setTimeout(() => {
            toast({
              title: "Советы по улучшению",
              description: error.suggestions.join(' • '),
              duration: 8000,
            })
          }, 2000)
        }
      }
    }
    
    setIsProcessing(false)
  }

  const processReceiptWithOCR = async (file: File): Promise<OrderData> => {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await fetch('/api/ocr/process', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      // Parse detailed error response
      let errorData
      try {
        errorData = await response.json()
      } catch (parseError) {
        throw {
          error: 'Ошибка обработки чека',
          errorType: 'processing',
          details: 'Не удалось получить ответ от сервера',
          suggestions: ['Проверьте интернет-соединение', 'Обработать чек еще раз']
        }
      }
      
      throw errorData
    }

    return response.json()
  }

  const retryFileProcessing = async (uploadedFile: UploadedFile) => {
    // Reset file status
    setUploadedFiles(prev => 
      prev.map(f => 
        f.file.name === uploadedFile.file.name 
          ? { ...f, status: 'pending', progress: 0 }
          : f
      )
    )
    
    // Retry processing
    await processFiles([uploadedFile])
  }

  // Order completion functions
  const handleOrderCompletion = (order: OrderData) => {
    setSelectedOrderForCompletion(order)
    setShowCompletionDialog(true)
  }

  const handleCompleteOrder = async (orderId: string, completionData: OrderCompletionData) => {
    try {
      const response = await fetch('/api/orders/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId,
          ...completionData
        })
      })

      if (!response.ok) {
        throw new Error('Failed to complete order')
      }

      const completedOrder = await response.json()

      // Move order from active to completed
      setActiveOrders(prev => prev.filter(order => order.id !== orderId))
      setCompletedOrders(prev => [...prev, completedOrder])

      // Refresh current shift data
      const shiftResponse = await fetch('/api/shifts/current')
      const shiftData = await shiftResponse.json()
      setCurrentShift(shiftData)

    } catch (error) {
      throw error
    }
  }

  const handleOrderUpdate = (updatedOrder: OrderData) => {
    if (updatedOrder.status === 'active') {
      setActiveOrders(prev => 
        prev.map(order => 
          order.id === updatedOrder.id ? updatedOrder : order
        )
      )
    } else {
      setCompletedOrders(prev => 
        prev.map(order => 
          order.id === updatedOrder.id ? updatedOrder : order
        )
      )
    }
  }

  const handleOrderDelete = (orderId: string) => {
    setActiveOrders(prev => prev.filter(order => order.id !== orderId))
    setCompletedOrders(prev => prev.filter(order => order.id !== orderId))
    toast({
      title: "Заказ удален",
      description: "Заказ удален из списка",
    })
  }

  // Zone management functions
  const handleZoneUpdate = (updatedZones: DeliveryZoneData[]) => {
    setZones(updatedZones)
  }

  // Shift management functions
  const handleEndShift = async () => {
    try {
      const response = await fetch('/api/shifts/current', {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to end shift')
      }

      const endedShift = await response.json()
      setCurrentShift(null)
      setShowStatistics(false)

      toast({
        title: "Смена завершена",
        description: `Завершена смена с заработком ${endedShift.totalEarnings}₽`,
      })

      // Refresh data for new shift
      await initializeData()

    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось завершить смену",
        variant: "destructive",
      })
    }
  }

  const handleAddMoreFiles = () => {
    fileInputRef.current?.click()
  }

  const buildMultipleRoute = () => {
    const addresses = activeOrders
      .filter(order => order.deliveryAddress)
      .map(order => order.deliveryAddress)
      .join(' / ')
    
    if (addresses) {
      const yandexMapsUrl = `https://yandex.ru/maps/?rtext=${encodeURIComponent(addresses)}&rtt=auto`
      window.open(yandexMapsUrl, '_blank')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ReceiptText className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">
                Анализатор чеков
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowStatistics(!showStatistics)}
                className="mobile-button"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Статистика
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Upload Zone or Add More Button */}
        {!showAddMore ? (
          <FileUploadZone onFileUpload={handleFileUpload} />
        ) : (
          <div className="mb-6">
            <Button
              onClick={handleAddMoreFiles}
              variant="outline"
              className="w-full mobile-button"
            >
              <Plus className="h-4 w-4 mr-2" />
              Добавить еще чеки
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) {
                  handleFileUpload(e.target.files)
                }
              }}
            />
          </div>
        )}

        {/* Processing Progress */}
        {isProcessing && (
          <ProcessingProgress files={uploadedFiles} />
        )}

        {/* Statistics Panel */}
        {showStatistics && (
          <div className="mb-6">
            <ShiftStatistics
              onEndShift={handleEndShift}
              onOpenSettings={() => setShowZoneSettings(true)}
            />
          </div>
        )}

        {/* Orders Management */}
        {(activeOrders.length > 0 || completedOrders.length > 0 || showAddMore) && (
          <OrderTabs
            activeOrders={activeOrders}
            completedOrders={completedOrders}
          >
            {(orders, type) => (
              <>
                {orders.length > 0 ? (
                  <div className="space-y-4">
                    {orders.map((order, index) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        index={index}
                        onUpdate={handleOrderUpdate}
                        onDelete={handleOrderDelete}
                        onComplete={type === 'active' ? handleOrderCompletion : undefined}
                        showCompleteButton={type === 'active'}
                      />
                    ))}
                  </div>
                ) : (
                  <Card className="text-center py-12">
                    <CardContent>
                      <ReceiptText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        {type === 'active' 
                          ? "Нет активных заказов. Загрузите чеки, чтобы увидеть информацию о заказах"
                          : "Нет завершенных заказов в текущей смене"
                        }
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </OrderTabs>
        )}

        {/* Empty State - No Orders at All */}
        {activeOrders.length === 0 && completedOrders.length === 0 && !isProcessing && !showAddMore && (
          <Card className="text-center py-12">
            <CardContent>
              <ReceiptText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Загрузите чеки, чтобы начать работу
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sticky Footer for Multiple Route */}
      {activeOrders.length > 1 && (
        <div className="sticky-footer">
          <div className="container mx-auto px-4 max-w-4xl">
            <RouteBuilder
              orders={activeOrders}
              onBuildRoute={buildMultipleRoute}
            />
          </div>
        </div>
      )}

      {/* Dialogs */}
      {selectedOrderForCompletion && (
        <OrderCompletionDialog
          order={selectedOrderForCompletion}
          open={showCompletionDialog}
          onOpenChange={setShowCompletionDialog}
          onComplete={handleCompleteOrder}
          zones={zones}
        />
      )}

      <ZoneSettingsDialog
        open={showZoneSettings}
        onOpenChange={setShowZoneSettings}
        zones={zones}
        onUpdate={handleZoneUpdate}
      />
    </div>
  )
}
