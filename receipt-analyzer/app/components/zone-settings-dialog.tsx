
'use client'

import { useState, useEffect } from 'react'
import { Settings, Save, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { DeliveryZoneData } from '@/lib/types'

interface ZoneSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  zones: DeliveryZoneData[]
  onUpdate: (zones: DeliveryZoneData[]) => void
}

export function ZoneSettingsDialog({
  open,
  onOpenChange,
  zones,
  onUpdate
}: ZoneSettingsDialogProps) {
  const [localZones, setLocalZones] = useState<DeliveryZoneData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setLocalZones([...zones])
  }, [zones])

  const handleRateChange = (zoneName: string, newRate: string) => {
    const rate = parseFloat(newRate) || 0
    setLocalZones(prev => 
      prev.map(zone => 
        zone.name === zoneName 
          ? { ...zone, rate }
          : zone
      )
    )
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/zones', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          zones: localZones.map(zone => ({
            name: zone.name,
            rate: zone.rate
          }))
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update zones')
      }

      const updatedZones = await response.json()
      onUpdate(updatedZones)
      onOpenChange(false)
      
      toast({
        title: "Настройки сохранены",
        description: "Тарифы зон успешно обновлены",
      })
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить настройки",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-primary" />
            <span>Настройки зон</span>
          </DialogTitle>
          <DialogDescription>
            Настройте тарифы доставки для каждой зоны Геленджика
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {localZones.map((zone) => (
            <Card key={zone.name}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: zone.color }}
                  />
                  <span className="font-medium">{zone.displayName}</span>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`rate-${zone.name}`} className="text-sm">
                    Тариф за доставку
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id={`rate-${zone.name}`}
                      type="number"
                      value={zone.rate}
                      onChange={(e) => handleRateChange(zone.name, e.target.value)}
                      placeholder="0"
                      className="pl-10"
                      step="10"
                      min="0"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <DialogFooter className="flex-col sm:flex-row space-y-2 sm:space-y-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Отмена
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="w-full sm:w-auto mobile-button"
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
