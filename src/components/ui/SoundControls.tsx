import React from 'react';
import { Volume2, VolumeX, Music, Music2 } from 'lucide-react';
import { useSound } from '@/hooks/useSound';
import { cn } from '@/lib/utils';

export const SoundControls: React.FC<{ className?: string }> = ({ className }) => {
  const { musicEnabled, sfxEnabled, toggleMusic, toggleSfx } = useSound();

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <button
        onClick={toggleSfx}
        className={cn(
          'p-2 border-2 transition-colors',
          sfxEnabled 
            ? 'border-primary text-primary' 
            : 'border-muted-foreground text-muted-foreground'
        )}
        title={sfxEnabled ? 'Mute sound effects' : 'Enable sound effects'}
      >
        {sfxEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
      </button>
      
      <button
        onClick={toggleMusic}
        className={cn(
          'p-2 border-2 transition-colors',
          musicEnabled 
            ? 'border-primary text-primary' 
            : 'border-muted-foreground text-muted-foreground'
        )}
        title={musicEnabled ? 'Mute music' : 'Enable music'}
      >
        {musicEnabled ? <Music className="w-4 h-4" /> : <Music2 className="w-4 h-4" />}
      </button>
    </div>
  );
};
