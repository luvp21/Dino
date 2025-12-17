import React from 'react';
import { cn } from '@/lib/utils';

interface PixelButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const PixelButton: React.FC<PixelButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}) => {
  const baseStyles = 'font-pixel uppercase tracking-wider transition-all duration-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantStyles = {
    primary: 'pixel-btn bg-primary text-primary-foreground hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px]',
    outline: 'pixel-btn-outline bg-background text-foreground hover:bg-secondary hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px]',
    ghost: 'bg-transparent text-foreground border-2 border-transparent hover:border-border',
  };

  const sizeStyles = {
    sm: 'px-3 py-2 text-[8px]',
    md: 'px-4 py-3 text-[10px]',
    lg: 'px-6 py-4 text-[12px]',
  };

  return (
    <button
      className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
      {...props}
    >
      {children}
    </button>
  );
};
