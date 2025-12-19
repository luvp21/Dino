// Retro Chiptune Sound System using Web Audio API
class RetroSoundEngine {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicOscillators: OscillatorNode[] = [];
  private isMusicPlaying = false;
  private musicEnabled = true;
  private sfxEnabled = true;

  private initAudio() {
    if (this.audioContext) return;

    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.3;
    this.masterGain.connect(this.audioContext.destination);

    this.musicGain = this.audioContext.createGain();
    this.musicGain.gain.value = 0.15;
    this.musicGain.connect(this.masterGain);

    this.sfxGain = this.audioContext.createGain();
    this.sfxGain.gain.value = 0.5;
    this.sfxGain.connect(this.masterGain);
  }

  private ensureContext() {
    this.initAudio();
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  // Simple oscillator-based sound
  private playTone(
    frequency: number,
    duration: number,
    type: OscillatorType = 'square',
    gainNode: GainNode | null = this.sfxGain,
    frequencySlide?: number
  ) {
    this.ensureContext();
    if (!this.audioContext || !gainNode) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

    if (frequencySlide) {
      osc.frequency.linearRampToValueAtTime(
        frequency + frequencySlide,
        this.audioContext.currentTime + duration
      );
    }

    gain.gain.setValueAtTime(0.5, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    osc.connect(gain);
    gain.connect(gainNode);

    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + duration);
  }

  // Jump sound - rising pitch
  playJump() {
    if (!this.sfxEnabled) return;
    this.playTone(200, 0.15, 'square', this.sfxGain, 400);
  }

  // Duck sound - quick low tone
  playDuck() {
    if (!this.sfxEnabled) return;
    this.playTone(150, 0.1, 'square', this.sfxGain, -50);
  }

  // Hit/collision sound - noise burst
  playHit() {
    if (!this.sfxEnabled) return;
    this.ensureContext();
    if (!this.audioContext || !this.sfxGain) return;

    // Create noise for impact
    const bufferSize = this.audioContext.sampleRate * 0.2;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
    }

    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;

    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.8, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start();
  }

  // Game over sound - descending tones
  playGameOver() {
    if (!this.sfxEnabled) return;
    this.ensureContext();

    const notes = [523, 392, 330, 262]; // C5, G4, E4, C4
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.3, 'square', this.sfxGain);
      }, i * 150);
    });
  }

  // Score milestone sound
  playScore() {
    if (!this.sfxEnabled) return;
    this.playTone(880, 0.1, 'square', this.sfxGain, 220);
    setTimeout(() => {
      this.playTone(1100, 0.15, 'square', this.sfxGain);
    }, 100);
  }

  // Coin earned sound
  playCoin() {
    if (!this.sfxEnabled) return;
    this.playTone(987, 0.08, 'square', this.sfxGain);
    setTimeout(() => {
      this.playTone(1318, 0.12, 'square', this.sfxGain);
    }, 80);
  }

  // Background music - simple looping melody
  startMusic() {
    if (!this.musicEnabled || this.isMusicPlaying) return;
    this.ensureContext();
    if (!this.audioContext || !this.musicGain) return;

    this.isMusicPlaying = true;
    this.playMusicLoop();
  }

  private playMusicLoop() {
    if (!this.isMusicPlaying || !this.audioContext || !this.musicGain) return;

    // Simple bass line pattern (C, G, A, E)
    const bassNotes = [130.81, 98, 110, 82.41];
    // Melody pattern
    const melodyNotes = [262, 330, 392, 330, 262, 294, 330, 294];

    const beatDuration = 0.25;
    const patternLength = bassNotes.length * beatDuration * 2;

    // Play bass
    bassNotes.forEach((freq, i) => {
      if (!this.isMusicPlaying) return;
      setTimeout(() => {
        if (this.isMusicPlaying) {
          this.playMusicNote(freq, beatDuration * 1.8, 'triangle');
        }
      }, i * beatDuration * 2 * 1000);
    });

    // Play melody
    melodyNotes.forEach((freq, i) => {
      if (!this.isMusicPlaying) return;
      setTimeout(() => {
        if (this.isMusicPlaying) {
          this.playMusicNote(freq, beatDuration * 0.8, 'square');
        }
      }, i * beatDuration * 1000);
    });

    // Loop
    setTimeout(() => {
      if (this.isMusicPlaying) {
        this.playMusicLoop();
      }
    }, patternLength * 1000);
  }

  private playMusicNote(frequency: number, duration: number, type: OscillatorType) {
    if (!this.audioContext || !this.musicGain) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = type;
    osc.frequency.value = frequency;

    gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gain.gain.setValueAtTime(0.3, this.audioContext.currentTime + duration * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + duration);
  }

  stopMusic() {
    this.isMusicPlaying = false;
    this.musicOscillators.forEach(osc => {
      try { osc.stop(); } catch (e) {}
    });
    this.musicOscillators = [];
  }

  toggleMusic(): boolean {
    this.musicEnabled = !this.musicEnabled;
    if (!this.musicEnabled) {
      this.stopMusic();
    }
    return this.musicEnabled;
  }

  toggleSfx(): boolean {
    this.sfxEnabled = !this.sfxEnabled;
    return this.sfxEnabled;
  }

  setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (!enabled) {
      this.stopMusic();
    }
  }

  setSfxEnabled(enabled: boolean) {
    this.sfxEnabled = enabled;
  }
}

// Singleton instance
export const soundEngine = new RetroSoundEngine();
