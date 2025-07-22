
'use client'

import { useState, useEffect } from 'react'
import { BarChart3, DollarSign, Package, Clock, Settings, FileText, Download, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatisticsData, ShiftReport } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'

interface ShiftStatisticsProps {
  onEndShift: () => void
  onOpenSettings: () => void
}

export function ShiftStatistics({ onEndShift, onOpenSettings }: ShiftStatisticsProps) {
  const [statisticsData, setStatisticsData] = useState<StatisticsData | null>(null)
  const [shiftReport, setShiftReport] = useState<ShiftReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [showReport, setShowReport] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const { toast } = useToast()

  useEffect(() => {
    fetchStatistics()
    const timer = setInterval(() => {
      setCurrentTime(new Date())
      fetchStatistics() // Refresh statistics every minute
    }, 60000)
    
    const clockTimer = setInterval(() => setCurrentTime(new Date()), 1000)
    
    return () => {
      clearInterval(timer)
      clearInterval(clockTimer)
    }
  }, [])

  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/statistics')
      const data = await response.json()
      
      if (response.ok) {
        // Convert date strings back to Date objects
        if (data.shift?.startTime) {
          data.shift.startTime = new Date(data.shift.startTime)
        }
        if (data.statistics?.shiftStart) {
          data.statistics.shiftStart = new Date(data.statistics.shiftStart)
        }
        data.ordersList?.forEach((order: any) => {
          if (order.completedAt) {
            order.completedAt = new Date(order.completedAt)
          }
        })
        
        setStatisticsData(data)
      }
    } catch (error) {
      console.error('Error fetching statistics:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateReport = async () => {
    try {
      const response = await fetch('/api/statistics/report', {
        method: 'POST'
      })
      
      if (response.ok) {
        const report = await response.json()
        setShiftReport(report)
        setShowReport(true)
      } else {
        toast({
          title: "Ошибка",
          description: "Не удалось сгенерировать отчет",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось сгенерировать отчет",
        variant: "destructive"
      })
    }
  }

  const handleEndShift = async () => {
    await generateReport()
    onEndShift()
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Загрузка статистики...</p>
        </CardContent>
      </Card>
    )
  }

  if (!statisticsData?.shift) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Нет активной смены</p>
        </CardContent>
      </Card>
    )
  }

  const { shift, statistics, paymentBreakdown, zoneBreakdown, ordersList } = statisticsData

  const formatDuration = (start: Date, end?: Date) => {
    const endTime = end || currentTime
    const diff = endTime.getTime() - start.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}ч ${minutes}м`
  }

  if (showReport && shiftReport) {
    return (
      <div className="space-y-4">
        {/* Report Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Отчет за смену</h2>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowReport(false)}
          >
            <Eye className="h-4 w-4 mr-2" />
            Статистика
          </Button>
        </div>

        {/* Report Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Сводка смены</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Дата:</p>
                <p className="font-medium">{shiftReport.date}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Продолжительность:</p>
                <p className="font-medium">{shiftReport.duration}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Начало:</p>
                <p className="font-medium">{shiftReport.startTime}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Окончание:</p>
                <p className="font-medium">{shiftReport.endTime}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 pt-3 border-t">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{shiftReport.summary.totalOrders}</p>
                <p className="text-sm text-muted-foreground">Заказов</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{shiftReport.summary.totalAmount.toFixed(2)}₽</p>
                <p className="text-sm text-muted-foreground">Общая сумма</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{shiftReport.summary.totalEarnings.toFixed(2)}₽</p>
                <p className="text-sm text-muted-foreground">Заработок</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">По способам оплаты</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(shiftReport.paymentBreakdown)
              .filter(([_, data]) => data.count > 0)
              .map(([method, data]) => (
                <div key={method} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{data.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {data.count} {data.count === 1 ? 'заказ' : 'заказов'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">{data.amount.toFixed(2)}₽</p>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>

        {/* Zone Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">По зонам доставки</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(shiftReport.zoneBreakdown)
              .filter(([_, data]) => data.count > 0)
              .map(([zone, data]) => (
                <div key={zone} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{data.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {data.count} {data.count === 1 ? 'доставка' : 'доставок'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-purple-600">{data.earnings.toFixed(2)}₽</p>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>

        {/* Orders List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Список заказов</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {shiftReport.ordersList.map((order) => (
                <div key={order.number} className="flex items-center justify-between p-2 text-sm border rounded">
                  <div className="flex-1">
                    <p className="font-medium">#{order.number} - {order.restaurant}</p>
                    <p className="text-muted-foreground text-xs">{order.address}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{order.amount.toFixed(2)}₽</p>
                    <p className="text-xs text-muted-foreground">{order.paymentMethod}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Button 
          onClick={() => setShowReport(false)}
          className="w-full mobile-button"
          variant="default"
        >
          Закрыть отчет
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Статистика смены</h2>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={generateReport}
          >
            <FileText className="h-4 w-4 mr-2" />
            Отчет
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onOpenSettings}
          >
            <Settings className="h-4 w-4 mr-2" />
            Настройки
          </Button>
        </div>
      </div>

      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="summary">Сводка</TabsTrigger>
          <TabsTrigger value="payments">Оплата</TabsTrigger>
          <TabsTrigger value="zones">Зоны</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          {/* Main Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Package className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{statistics?.totalOrders || 0}</p>
                    <p className="text-sm text-muted-foreground">Доставок</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">{statistics?.totalEarnings.toFixed(2) || '0'}₽</p>
                    <p className="text-sm text-muted-foreground">Заработок</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Time */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="font-medium">Время в смене</p>
                    <p className="text-sm text-muted-foreground">
                      Начало: {shift.startTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <p className="text-xl font-bold text-amber-600">
                  {statistics?.shiftDuration.formatted || formatDuration(shift.startTime)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Additional Stats */}
          {statistics && statistics.totalOrders > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Средний чек:</p>
                    <p className="text-lg font-bold">{statistics.averageOrderValue.toFixed(2)}₽</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Доход за заказ:</p>
                    <p className="text-lg font-bold">{statistics.averageEarningsPerOrder.toFixed(2)}₽</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          {paymentBreakdown && (
            <div className="space-y-3">
              {Object.entries(paymentBreakdown)
                .filter(([_, data]) => data.count > 0)
                .map(([method, data]) => {
                  const methodLabels = {
                    cash: 'Наличные',
                    terminal: 'Терминал',
                    transfer: 'Переводы',
                    paid: 'Оплаченные'
                  }
                  
                  return (
                    <Card key={method}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{methodLabels[method as keyof typeof methodLabels]}</p>
                            <p className="text-sm text-muted-foreground">
                              {data.count} {data.count === 1 ? 'заказ' : 'заказов'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-600">{data.amount.toFixed(2)}₽</p>
                            <p className="text-sm text-muted-foreground">
                              Заработок: {data.earnings.toFixed(2)}₽
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              
              {Object.values(paymentBreakdown).every(data => data.count === 0) && (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Нет завершенных заказов</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="zones" className="space-y-4">
          {zoneBreakdown && (
            <div className="space-y-3">
              {Object.entries(zoneBreakdown)
                .filter(([_, data]) => data.count > 0)
                .map(([zone, data]) => (
                  <Card key={zone}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: data.color }}
                          />
                          <div>
                            <p className="font-medium">{data.displayName}</p>
                            <p className="text-sm text-muted-foreground">
                              {data.count} {data.count === 1 ? 'доставка' : 'доставок'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-purple-600">{data.earnings.toFixed(2)}₽</p>
                          <p className="text-sm text-muted-foreground">
                            Сумма: {data.amount.toFixed(2)}₽
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              
              {Object.values(zoneBreakdown).every(data => data.count === 0) && (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Нет завершенных доставок</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* End Shift Button */}
      <Button 
        onClick={handleEndShift}
        className="w-full mobile-button"
        variant="destructive"
      >
        Завершить смену
      </Button>
    </div>
  )
}
