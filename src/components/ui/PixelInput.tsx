import React from 'react';
import { cn } from '@/lib/utils';

interface PixelInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const PixelInput: React.FC<PixelInputProps> = ({
  className,
  label,
  id,
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={id} 
          className="block text-[10px] mb-2 uppercase"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        className={cn(
          'pixel-input text-[10px] uppercase',
          className
        )}
        {...props}
      />
    </div>
  );
};
