
'use client'

import { useCallback, useState } from 'react'
import { UploadCloud, FileText, Image } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface FileUploadZoneProps {
  onFileUpload: (files: FileList) => void
}

export function FileUploadZone({ onFileUpload }: FileUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      onFileUpload(files)
    }
  }, [onFileUpload])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      onFileUpload(files)
    }
  }, [onFileUpload])

  return (
    <Card className={`upload-zone ${isDragOver ? 'dragover' : ''}`}>
      <CardContent 
        className="p-12 text-center"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="space-y-6">
          <div className="flex justify-center space-x-4 mb-6">
            <UploadCloud className="h-12 w-12 text-primary" />
            <div className="flex space-x-2">
              <Image className="h-8 w-8 text-muted-foreground" />
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-foreground">
              Загрузите фото чеков
            </h3>
            <p className="text-muted-foreground">
              Перетащите файлы сюда или нажмите для выбора
            </p>
            <p className="text-sm text-muted-foreground">
              Поддерживаются форматы: JPG, PNG, PDF (до 10MB)
            </p>
          </div>

          <div className="space-y-4">
            <Button
              size="lg"
              className="mobile-button"
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <UploadCloud className="h-5 w-5 mr-2" />
              Выбрать файлы
            </Button>
            
            <input
              id="file-input"
              type="file"
              multiple
              accept="image/*,application/pdf"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Быстрая обработка</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Безопасно</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span>Автоматически</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
