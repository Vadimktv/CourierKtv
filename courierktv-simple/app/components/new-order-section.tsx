
'use client'

import { useState } from 'react'
import { Plus, Upload, MapPin, CreditCard, Banknote } from 'lucide-react'
import { saveOrder, loadShiftData } from '../lib/storage'

interface OrderForm {
  zone: string
  paymentMethod: string
  receiptFile: File | null
  receiptFileName: string
}

const ZONES = [
  { id: 'center', name: 'Центр', price: 300 },
  { id: 'tolstiy', name: 'Толстый мыс', price: 400 },
  { id: 'tonkiy', name: 'Тонкий мыс', price: 350 },
  { id: 'golubaya', name: 'Голубая бухта', price: 450 }
]

export default function NewOrderSection() {
  const [form, setForm] = useState<OrderForm>({
    zone: '',
    paymentMethod: '',
    receiptFile: null,
    receiptFileName: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setForm(prev => ({
        ...prev,
        receiptFile: file,
        receiptFileName: file.name
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Проверяем активность смены
      const shiftData = loadShiftData()
      if (!shiftData?.isActive) {
        alert('Начните смену перед добавлением заказа!')
        setIsLoading(false)
        return
      }

      // Валидация
      if (!form.zone || !form.paymentMethod) {
        alert('Пожалуйста, заполните все поля')
        setIsLoading(false)
        return
      }

      // Находим цену для выбранной зоны
      const selectedZone = ZONES.find(z => z.id === form.zone)
      if (!selectedZone) {
        alert('Неверная зона')
        setIsLoading(false)
        return
      }

      // Создаем заказ
      const order = {
        id: Date.now().toString(),
        zone: selectedZone.name,
        paymentMethod: form.paymentMethod,
        earnings: selectedZone.price,
        receiptFileName: form.receiptFileName || 'Без чека',
        timestamp: new Date().toISOString()
      }

      // Сохраняем заказ
      saveOrder(order)

      // Очищаем форму
      setForm({
        zone: '',
        paymentMethod: '',
        receiptFile: null,
        receiptFileName: ''
      })

      // Сбрасываем файл инпут
      const fileInput = document.getElementById('receipt-file') as HTMLInputElement
      if (fileInput) {
        fileInput.value = ''
      }

      alert('Заказ добавлен!')
    } catch (error) {
      console.error('Ошибка добавления заказа:', error)
      alert('Произошла ошибка при добавлении заказа')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-4">
        <Plus className="h-6 w-6 text-green-600" />
        <h2 className="text-xl font-bold text-white">Новый заказ</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            <MapPin className="h-4 w-4 inline mr-1" />
            Зона доставки
          </label>
          <select
            value={form.zone}
            onChange={(e) => setForm(prev => ({ ...prev, zone: e.target.value }))}
            className="select w-full"
            disabled={isLoading}
          >
            <option value="">Выберите зону</option>
            {ZONES.map(zone => (
              <option key={zone.id} value={zone.id}>
                {zone.name} - {zone.price} ₽
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Способ оплаты
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setForm(prev => ({ ...prev, paymentMethod: 'cash' }))}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-colors ${
                form.paymentMethod === 'cash'
                  ? 'border-green-600 bg-green-600/20 text-green-400'
                  : 'border-zinc-600 text-zinc-400 hover:border-zinc-500'
              }`}
              disabled={isLoading}
            >
              <Banknote className="h-5 w-5" />
              Наличные
            </button>
            
            <button
              type="button"
              onClick={() => setForm(prev => ({ ...prev, paymentMethod: 'card' }))}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-colors ${
                form.paymentMethod === 'card'
                  ? 'border-green-600 bg-green-600/20 text-green-400'
                  : 'border-zinc-600 text-zinc-400 hover:border-zinc-500'
              }`}
              disabled={isLoading}
            >
              <CreditCard className="h-5 w-5" />
              Карта
            </button>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            <Upload className="h-4 w-4 inline mr-1" />
            Чек (необязательно)
          </label>
          <input
            id="receipt-file"
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileUpload}
            className="hidden"
            disabled={isLoading}
          />
          <label
            htmlFor="receipt-file"
            className="btn-outline w-full flex items-center justify-center gap-2 cursor-pointer"
          >
            <Upload className="h-5 w-5" />
            {form.receiptFileName || 'Загрузить чек'}
          </label>
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <Plus className="h-5 w-5" />
          {isLoading ? 'Добавление...' : 'Добавить заказ'}
        </button>
      </form>
    </div>
  )
}
