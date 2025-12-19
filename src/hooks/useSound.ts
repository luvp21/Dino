import { useState, useEffect, useCallback } from 'react';
import { soundEngine } from '@/services/soundEngine';

export function useSound() {
  const [musicEnabled, setMusicEnabled] = useState(() => {
    const stored = localStorage.getItem('pixel-dino-music');
    return stored !== 'false';
  });

  const [sfxEnabled, setSfxEnabled] = useState(() => {
    const stored = localStorage.getItem('pixel-dino-sfx');
    return stored !== 'false';
  });

  const [musicPlaying, setMusicPlaying] = useState(false);

  useEffect(() => {
    soundEngine.setMusicEnabled(musicEnabled);
    soundEngine.setSfxEnabled(sfxEnabled);
  }, []);

  const toggleMusic = useCallback(() => {
    const newState = soundEngine.toggleMusic();
    setMusicEnabled(newState);
    localStorage.setItem('pixel-dino-music', String(newState));
    return newState;
  }, []);

  const toggleSfx = useCallback(() => {
    const newState = soundEngine.toggleSfx();
    setSfxEnabled(newState);
    localStorage.setItem('pixel-dino-sfx', String(newState));
    return newState;
  }, []);

  const startMusic = useCallback(() => {
    soundEngine.startMusic();
    setMusicPlaying(true);
  }, []);

  const stopMusic = useCallback(() => {
    soundEngine.stopMusic();
    setMusicPlaying(false);
  }, []);

  const playJump = useCallback(() => {
    soundEngine.playJump();
  }, []);

  const playDuck = useCallback(() => {
    soundEngine.playDuck();
  }, []);

  const playHit = useCallback(() => {
    soundEngine.playHit();
  }, []);

  const playGameOver = useCallback(() => {
    soundEngine.playGameOver();
  }, []);

  const playCoin = useCallback(() => {
    soundEngine.playCoin();
  }, []);

  return {
    musicEnabled,
    sfxEnabled,
    musicPlaying,
    toggleMusic,
    toggleSfx,
    startMusic,
    stopMusic,
    playJump,
    playDuck,
    playHit,
    playGameOver,
    playCoin,
  };
}
