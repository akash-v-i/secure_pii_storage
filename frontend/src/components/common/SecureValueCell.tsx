import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SecureValueCellProps {
  value: string;
  revealDuration?: number;
  onReveal?: () => void;
}

export const SecureValueCell: React.FC<SecureValueCellProps> = ({
  value,
  revealDuration = 5,
  onReveal,
}) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRevealed && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (isRevealed && countdown === 0) {
      setIsRevealed(false);
    }
    return () => clearTimeout(timer);
  }, [isRevealed, countdown]);

  const handleReveal = () => {
    setIsRevealed(true);
    setCountdown(revealDuration);
    onReveal?.();
  };

  const handleHide = () => {
    setIsRevealed(false);
    setCountdown(0);
  };

  const maskedValue = value.replace(/./g, '•');

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 min-w-[120px]">
        {!isRevealed && (
          <Lock className="w-3.5 h-3.5 text-secure flex-shrink-0" />
        )}
        <span
          className={cn(
            "font-mono text-sm transition-all duration-300",
            isRevealed ? "text-foreground" : "text-muted-foreground select-none"
          )}
        >
          {isRevealed ? value : maskedValue}
        </span>
      </div>
      
      <div className="flex items-center gap-1">
        {isRevealed ? (
          <>
            <span className="text-xs text-muted-foreground tabular-nums">
              {countdown}s
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleHide}
            >
              <EyeOff className="w-4 h-4" />
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={handleReveal}
          >
            <Eye className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
