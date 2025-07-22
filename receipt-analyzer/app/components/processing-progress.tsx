
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { UploadedFile } from '@/lib/types'
import { FileText, CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface ProcessingProgressProps {
  files: UploadedFile[]
}

export function ProcessingProgress({ files }: ProcessingProgressProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'processing':
        return <Loader2 className="h-4 w-4 text-primary animate-spin" />
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Обработан'
      case 'failed':
        return 'Ошибка'
      case 'processing':
        return 'Обрабатывается...'
      default:
        return 'Ожидает обработки'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-500'
      case 'failed':
        return 'text-red-500'
      case 'processing':
        return 'text-primary'
      default:
        return 'text-muted-foreground'
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">Обработка чеков</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {files.map((file, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getStatusIcon(file.status)}
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {file.file.name}
                  </p>
                  <p className={`text-xs ${getStatusColor(file.status)}`}>
                    {getStatusText(file.status)}
                  </p>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                {Math.round(file.file.size / 1024)} KB
              </div>
            </div>
            
            {file.status === 'processing' && (
              <div className="space-y-1">
                <Progress value={file.progress} className="h-2" />
                <p className="text-xs text-center text-muted-foreground">
                  {file.progress}%
                </p>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
