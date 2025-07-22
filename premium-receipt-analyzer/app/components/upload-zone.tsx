
'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { UploadCloud, FileImage, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UploadZoneProps {
  onFilesUpload: (files: File[]) => void
  isProcessing?: boolean
}

export function UploadZone({ onFilesUpload, isProcessing = false }: UploadZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFilesUpload(acceptedFiles)
    }
  }, [onFilesUpload])

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/pdf': ['.pdf']
    },
    multiple: true,
    disabled: isProcessing,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    onDropAccepted: () => setIsDragActive(false),
    onDropRejected: () => setIsDragActive(false),
  })

  return (
    <div
      className={cn(
        "upload-zone cursor-pointer p-12 text-center transition-all duration-300",
        isDragActive && "dragover",
        isProcessing && "opacity-50 cursor-not-allowed"
      )}
      {...getRootProps()}
    >
      <input {...getInputProps()} />
      
      <div className="space-y-6">
        <div className={cn(
          "mx-auto transition-transform duration-300",
          isDragActive && "scale-110 rotate-180"
        )}>
          {isProcessing ? (
            <Loader2 className="h-16 w-16 text-primary mx-auto animate-spin" />
          ) : (
            <UploadCloud className="h-16 w-16 text-primary mx-auto" />
          )}
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-semibold">
            {isProcessing 
              ? "Обработка файлов..." 
              : isDragActive 
                ? "Отпустите файлы здесь" 
                : "Перетащите файлы сюда"
            }
          </h3>
          {!isProcessing && (
            <p className="text-muted-foreground">
              или нажмите для выбора файлов
            </p>
          )}
        </div>

        {!isProcessing && (
          <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <FileImage className="h-4 w-4" />
              <span>JPG, PNG</span>
            </div>
            <div className="w-1 h-1 bg-muted-foreground rounded-full" />
            <div className="flex items-center space-x-1">
              <FileImage className="h-4 w-4" />
              <span>PDF</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
