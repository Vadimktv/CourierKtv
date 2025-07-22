
'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface FileUploadProps {
  onFilesProcessed: (orders: any[]) => void;
}

interface ProcessingFile {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'success' | 'error';
  progress: number;
  result?: any;
  error?: string;
}

export default function FileUpload({ onFilesProcessed }: FileUploadProps) {
  const [files, setFiles] = useState<ProcessingFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      status: 'pending' as const,
      progress: 0
    }));
    
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp']
    },
    multiple: true
  });

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const processFiles = async () => {
    if (files.length === 0) return;
    
    setIsProcessing(true);
    const results: any[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const fileItem = files[i];
      
      // Update status to processing
      setFiles(prev => prev.map(f => 
        f.id === fileItem.id 
          ? { ...f, status: 'processing', progress: 0 }
          : f
      ));
      
      try {
        const formData = new FormData();
        formData.append('file', fileItem.file);
        
        // Update progress
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id 
            ? { ...f, progress: 50 }
            : f
        ));
        
        const response = await fetch('/api/process-receipt', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
          setFiles(prev => prev.map(f => 
            f.id === fileItem.id 
              ? { ...f, status: 'success', progress: 100, result: result.order }
              : f
          ));
          results.push(result.order);
        } else {
          throw new Error(result.error || 'Ошибка обработки');
        }
        
      } catch (error: any) {
        console.error('Processing error:', error);
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id 
            ? { ...f, status: 'error', progress: 0, error: error.message }
            : f
        ));
      }
    }
    
    setIsProcessing(false);
    
    if (results.length > 0) {
      onFilesProcessed(results);
    }
  };

  const clearAll = () => {
    setFiles([]);
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors">
        <CardContent className="p-8">
          <div 
            {...getRootProps()} 
            className={`text-center cursor-pointer transition-colors ${
              isDragActive ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {isDragActive ? 'Отпустите файлы здесь' : 'Загрузить чеки'}
            </h3>
            <p className="text-sm">
              Перетащите изображения чеков сюда или кликните для выбора файлов
            </p>
            <p className="text-xs mt-1 text-muted-foreground">
              Поддерживаются: JPEG, PNG, GIF, BMP
            </p>
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold">Файлы для обработки ({files.length})</h4>
              <div className="flex gap-2">
                <Button 
                  onClick={processFiles} 
                  disabled={isProcessing || files.every(f => f.status !== 'pending')}
                  size="sm"
                >
                  {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Обработать
                </Button>
                <Button onClick={clearAll} variant="outline" size="sm">
                  Очистить
                </Button>
              </div>
            </div>
            
            <div className="space-y-3">
              {files.map((fileItem) => (
                <div key={fileItem.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <div className="flex-shrink-0">
                    {fileItem.status === 'pending' && <File className="h-5 w-5 text-muted-foreground" />}
                    {fileItem.status === 'processing' && <Loader2 className="h-5 w-5 animate-spin text-blue-500" />}
                    {fileItem.status === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
                    {fileItem.status === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{fileItem.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(fileItem.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    
                    {fileItem.status === 'processing' && (
                      <Progress value={fileItem.progress} className="mt-1 h-1" />
                    )}
                    
                    {fileItem.status === 'error' && (
                      <p className="text-xs text-red-500 mt-1">{fileItem.error}</p>
                    )}
                    
                    {fileItem.status === 'success' && fileItem.result && (
                      <p className="text-xs text-green-600 mt-1">
                        {fileItem.result.restaurant} • {fileItem.result.totalAmount}₽
                      </p>
                    )}
                  </div>
                  
                  <Button
                    onClick={() => removeFile(fileItem.id)}
                    variant="ghost"
                    size="sm"
                    className="flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
