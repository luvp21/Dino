import React from 'react';
import { cn } from '@/lib/utils';

interface BillboardProps {
  position: 'left' | 'right';
  content?: string;
  imageUrl?: string;
  onClick?: () => void;
  className?: string;
}

export const Billboard: React.FC<BillboardProps> = ({
  position,
  content = 'AD SPACE',
  imageUrl,
  onClick,
  className,
}) => {
  return (
    <div
      className={cn(
        'absolute top-1/2 -translate-y-1/2 z-20 transition-all duration-300 hover:scale-105',
        position === 'left' ? 'left-0 -translate-x-1/2' : 'right-0 translate-x-1/2',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {/* Billboard Post */}
      <div className="flex flex-col items-center">
        {/* Billboard Frame */}
        <div
          className="relative pixel-border bg-background p-1"
          style={{
            width: '100px',
            height: '70px',
          }}
        >
          {/* Inner border */}
          <div className="absolute inset-1 border-2 border-foreground/20" />
          
          {/* Content */}
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-muted">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Advertisement"
                className="w-full h-full object-cover pixelated"
              />
            ) : (
              <div className="text-center p-1">
                <p className="text-[6px] font-pixel text-foreground/80 leading-tight">
                  {content}
                </p>
              </div>
            )}
          </div>
          
          {/* Corner decorations */}
          <div className="absolute top-0 left-0 w-2 h-2 bg-foreground" />
          <div className="absolute top-0 right-0 w-2 h-2 bg-foreground" />
          <div className="absolute bottom-0 left-0 w-2 h-2 bg-foreground" />
          <div className="absolute bottom-0 right-0 w-2 h-2 bg-foreground" />
        </div>
        
        {/* Post */}
        <div
          className="bg-foreground"
          style={{
            width: '8px',
            height: '40px',
          }}
        />
        
        {/* Base */}
        <div
          className="bg-foreground/80"
          style={{
            width: '24px',
            height: '6px',
          }}
        />
      </div>
    </div>
  );
};
