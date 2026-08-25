// Web Audio API Soundscape Generator for Zen & Healing Ambient Loop

export type AmbientSoundType = 'solfeggio' | 'rain' | 'waves' | 'forest';

export interface SoundOption {
  id: AmbientSoundType;
  name: string;
  description: string;
  icon: string;
  badge: string;
}

export const AMBIENT_SOUND_OPTIONS: SoundOption[] = [
  {
    id: 'solfeggio',
    name: 'Giai điệu Tần số 174Hz & 528Hz',
    description: 'Âm xoa dịu tâm trí, giảm căng thẳng và đem lại cảm giác an yên.',
    icon: 'graphic_eq',
    badge: 'Tần số chữa lành'
  },
  {
    id: 'rain',
    name: 'Tiếng Mưa Đêm Hiên Trọ',
    description: 'Âm thanh tiếng mưa rơi êm đềm lặp lại lồng ngực ấm áp.',
    icon: 'water_drop',
    badge: 'Mưa đêm Loop'
  },
  {
    id: 'waves',
    name: 'Sóng Biển Vỗ Bờ',
    description: 'Nhịp sóng nhấp nhô nhẹ nhàng giúp ngủ ngon & tập trung đọc.',
    icon: 'waves',
    badge: 'Nhịp sóng vỗ'
  },
  {
    id: 'forest',
    name: 'Tiếng Gió Rừng & Đêm Khuya',
    description: 'Tiếng gió thoảng qua rừng thông mang hương vị bình yên.',
    icon: 'forest',
    badge: 'Thiên nhiên'
  }
];

class AudioSynthesizerManager {
  private ctx: AudioContext | null = null;
  private currentType: AmbientSoundType | null = null;
  private masterGain: GainNode | null = null;
  private currentVolume: number = 0.5;
  private stopActiveNodes: (() => void) | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public play(type: AmbientSoundType, volume = 0.5) {
    this.stop();
    this.initContext();
    if (!this.ctx) return;

    this.currentType = type;
    this.currentVolume = volume;

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(volume * 0.15, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    if (type === 'solfeggio') {
      this.stopActiveNodes = this.createSolfeggioNodes(this.ctx, this.masterGain);
    } else if (type === 'rain') {
      this.stopActiveNodes = this.createRainNodes(this.ctx, this.masterGain);
    } else if (type === 'waves') {
      this.stopActiveNodes = this.createWavesNodes(this.ctx, this.masterGain);
    } else if (type === 'forest') {
      this.stopActiveNodes = this.createForestNodes(this.ctx, this.masterGain);
    }
  }

  public setVolume(volume: number) {
    this.currentVolume = volume;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(volume * 0.15, this.ctx.currentTime, 0.1);
    }
  }

  public stop() {
    if (this.stopActiveNodes) {
      this.stopActiveNodes();
      this.stopActiveNodes = null;
    }
    if (this.masterGain) {
      try {
        this.masterGain.disconnect();
      } catch (e) {}
      this.masterGain = null;
    }
    this.currentType = null;
  }

  public isPlaying(): boolean {
    return this.currentType !== null;
  }

  public getCurrentType(): AmbientSoundType | null {
    return this.currentType;
  }

  public getCurrentVolume(): number {
    return this.currentVolume;
  }

  // --- 1. Solfeggio 174Hz & 528Hz Ambient Chord Generator ---
  private createSolfeggioNodes(ctx: AudioContext, destination: GainNode): () => void {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const osc3 = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(174, ctx.currentTime); // Solfeggio 174Hz (xoa dịu)

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(285, ctx.currentTime); // Solfeggio 285Hz

    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(528, ctx.currentTime); // Solfeggio 528Hz (chữa lành)

    // LFO for slow ambient breathing volume effect
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.1, ctx.currentTime); // 10s breathing cycle
    lfoGain.gain.setValueAtTime(0.03, ctx.currentTime);
    lfo.connect(lfoGain.gain);

    osc1.connect(destination);
    osc2.connect(destination);
    osc3.connect(destination);

    osc1.start();
    osc2.start();
    osc3.start();
    lfo.start();

    return () => {
      try {
        osc1.stop();
        osc2.stop();
        osc3.stop();
        lfo.stop();
        osc1.disconnect();
        osc2.disconnect();
        osc3.disconnect();
        lfo.disconnect();
      } catch (e) {}
    };
  }

  // --- 2. Night Rain Generator (Filtered Pink Noise Loop) ---
  private createRainNodes(ctx: AudioContext, destination: GainNode): () => void {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      data[i] *= 0.11;
      b6 = white * 0.115926;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, ctx.currentTime);

    noise.connect(filter);
    filter.connect(destination);
    noise.start();

    return () => {
      try {
        noise.stop();
        noise.disconnect();
        filter.disconnect();
      } catch (e) {}
    };
  }

  // --- 3. Ocean Waves Generator ---
  private createWavesNodes(ctx: AudioContext, destination: GainNode): () => void {
    const bufferSize = ctx.sampleRate * 3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, ctx.currentTime);

    const waveLfo = ctx.createOscillator();
    waveLfo.frequency.setValueAtTime(0.08, ctx.currentTime); // 12s wave swell cycle

    const waveGain = ctx.createGain();
    waveGain.gain.setValueAtTime(0.2, ctx.currentTime);
    waveLfo.connect(waveGain.gain);

    noise.connect(filter);
    filter.connect(destination);
    noise.start();
    waveLfo.start();

    return () => {
      try {
        noise.stop();
        waveLfo.stop();
        noise.disconnect();
        waveLfo.disconnect();
        filter.disconnect();
      } catch (e) {}
    };
  }

  // --- 4. Forest Breeze Generator ---
  private createForestNodes(ctx: AudioContext, destination: GainNode): () => void {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(600, ctx.currentTime);
    bandpass.Q.setValueAtTime(2.0, ctx.currentTime);

    // Sine oscillator for gentle high insect chirps
    const chirpOsc = ctx.createOscillator();
    chirpOsc.type = 'sine';
    chirpOsc.frequency.setValueAtTime(3200, ctx.currentTime);
    const chirpGain = ctx.createGain();
    chirpGain.gain.setValueAtTime(0.005, ctx.currentTime);

    chirpOsc.connect(chirpGain);
    chirpGain.connect(destination);

    noise.connect(bandpass);
    bandpass.connect(destination);

    noise.start();
    chirpOsc.start();

    return () => {
      try {
        noise.stop();
        chirpOsc.stop();
        noise.disconnect();
        bandpass.disconnect();
        chirpOsc.disconnect();
      } catch (e) {}
    };
  }
}

export const ambientAudio = new AudioSynthesizerManager();
