import React from 'react';
import { cn } from '@/lib/utils';

interface PixelCardProps {
  className?: string;
  children: React.ReactNode;
  variant?: 'default' | 'outlined';
}

export const PixelCard: React.FC<PixelCardProps> = ({
  className,
  children,
  variant = 'default',
}) => {
  const variantStyles = {
    default: 'pixel-card',
    outlined: 'pixel-border bg-background p-4',
  };

  return (
    <div className={cn(variantStyles[variant], className)}>
      {children}
    </div>
  );
};

interface PixelCardHeaderProps {
  className?: string;
  children: React.ReactNode;
}

export const PixelCardHeader: React.FC<PixelCardHeaderProps> = ({
  className,
  children,
}) => {
  return (
    <div className={cn('border-b-2 border-border pb-3 mb-4', className)}>
      {children}
    </div>
  );
};

interface PixelCardTitleProps {
  className?: string;
  children: React.ReactNode;
}

export const PixelCardTitle: React.FC<PixelCardTitleProps> = ({
  className,
  children,
}) => {
  return (
    <h3 className={cn('text-[12px] md:text-[14px] font-pixel uppercase', className)}>
      {children}
    </h3>
  );
};
