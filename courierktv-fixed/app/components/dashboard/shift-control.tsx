
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Square, Clock, Loader2 } from 'lucide-react';

interface Shift {
  id: string;
  startTime: string;
  endTime?: string;
}

interface ShiftControlProps {
  onShiftChange: () => void;
}

export function ShiftControl({ onShiftChange }: ShiftControlProps) {
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [duration, setDuration] = useState('00:00:00');

  useEffect(() => {
    fetchActiveShift();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (activeShift?.startTime) {
      interval = setInterval(() => {
        const start = new Date(activeShift.startTime);
        const now = new Date();
        const diff = now.getTime() - start.getTime();
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        setDuration(
          `${hours.toString().padStart(2, '0')}:${minutes
            .toString()
            .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeShift]);

  const fetchActiveShift = async () => {
    try {
      const response = await fetch('/api/shifts');
      if (response.ok) {
        const data = await response.json();
        setActiveShift(data.activeShift);
      }
    } catch (error) {
      console.error('Error fetching shift:', error);
    }
  };

  const handleShiftAction = async () => {
    setIsLoading(true);
    
    try {
      const action = activeShift ? 'end' : 'start';
      const response = await fetch('/api/shifts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (action === 'start') {
          setActiveShift(data.shift);
        } else {
          setActiveShift(null);
          setDuration('00:00:00');
        }
        
        onShiftChange();
      } else {
        const errorData = await response.json();
        console.error('Shift action error:', errorData.error);
      }
    } catch (error) {
      console.error('Error managing shift:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <Clock className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold">
            {activeShift ? 'Смена активна' : 'Смена не начата'}
          </h2>
        </div>
        
        {activeShift && (
          <div className="p-4 bg-primary/10 rounded-lg">
            <div className="text-3xl font-mono font-bold text-primary">
              {duration}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Время работы
            </p>
          </div>
        )}
        
        <Button
          onClick={handleShiftAction}
          disabled={isLoading}
          variant={activeShift ? "destructive" : "default"}
          size="lg"
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Обработка...
            </>
          ) : activeShift ? (
            <>
              <Square className="mr-2 h-5 w-5" />
              Закончить смену
            </>
          ) : (
            <>
              <Play className="mr-2 h-5 w-5" />
              Начать смену
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
