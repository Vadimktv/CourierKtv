
'use client'

import { useState } from 'react'
import { Package, CheckCircle } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { OrderData } from '@/lib/types'

interface OrderTabsProps {
  activeOrders: OrderData[]
  completedOrders: OrderData[]
  children: (orders: OrderData[], type: 'active' | 'completed') => React.ReactNode
}

export function OrderTabs({ activeOrders, completedOrders, children }: OrderTabsProps) {
  return (
    <Tabs defaultValue="active" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="active" className="flex items-center space-x-2">
          <Package className="h-4 w-4" />
          <span>Активные</span>
          {activeOrders.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeOrders.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="completed" className="flex items-center space-x-2">
          <CheckCircle className="h-4 w-4" />
          <span>Завершенные</span>
          {completedOrders.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {completedOrders.length}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="active">
        {children(activeOrders, 'active')}
      </TabsContent>

      <TabsContent value="completed">
        {children(completedOrders, 'completed')}
      </TabsContent>
    </Tabs>
  )
}
