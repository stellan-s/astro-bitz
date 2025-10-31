export class AudioManager {
  private audioContext: AudioContext;
  private masterVolume: number = 0.3;
  private musicPlaying: boolean = false;
  private musicIntervalId: number | null = null;

  constructor() {
    this.audioContext = new AudioContext();
  }

  // Shooting sound - pew pew laser
  public playShoot(): void {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.1);

    gainNode.gain.setValueAtTime(this.masterVolume * 0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.1);
  }

  // Hit sound - explosion
  public playHit(): void {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const noiseGain = this.audioContext.createGain();

    // Create noise for explosion effect
    const bufferSize = this.audioContext.sampleRate * 0.2;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    noise.connect(noiseGain);
    noiseGain.connect(this.audioContext.destination);

    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.2);

    gainNode.gain.setValueAtTime(this.masterVolume * 0.4, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);

    noiseGain.gain.setValueAtTime(this.masterVolume * 0.2, this.audioContext.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.2);
    noise.start(this.audioContext.currentTime);
    noise.stop(this.audioContext.currentTime + 0.2);
  }

  // Game over sound - descending tone
  public playGameOver(): void {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.5);

    gainNode.gain.setValueAtTime(this.masterVolume * 0.5, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.5);
  }

  // Background music with melody and bass
  public startBackgroundMusic(): void {
    if (this.musicPlaying) return;
    this.musicPlaying = true;

    // --- Notes map ---
    const notes: Record<string, number> = {
      C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23,
      G4: 392.00, A4: 440.00, B4: 493.88,
      C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46,
      G5: 783.99, A5: 880.00,
      C3: 130.81, E3: 164.81, G3: 196.00, A3: 220.00
    };

    // --- Helpers ---
    const A4 = 440;
    const SEMI = Math.pow(2, 1/12);
    const NOTE_INDEX: Record<string, number> = {
      C: -9, 'C#': -8, Db: -8, D: -7, 'D#': -6, Eb: -6,
      E: -5, F: -4, 'F#': -3, Gb: -3, G: -2, 'G#': -1,
      Ab: -1, A: 0, 'A#': 1, Bb: 1, B: 2
    };

    const freqFromName = (name: string): number => {
      const m = name.match(/^([A-G][b#]?)(\d)$/);
      if(!m) throw new Error('Bad note name: ' + name);
      const [, step, octStr] = m;
      const oct = parseInt(octStr, 10);
      const n = NOTE_INDEX[step] + (oct - 4) * 12;
      return A4 * Math.pow(SEMI, n);
    };

    const f = (name: string): number => {
      return notes[name] ?? freqFromName(name);
    };

    const BPM = 96;
    const beat = 60 / BPM;

    // --- Progression: C | G | Am | F | C | G | Am | F ---
    const CHORDS = [
      ['C4','E4','G4'], ['G3','B3','D4'], ['A3','C4','E4'], ['F3','A3','C4'],
      ['C4','E4','G4'], ['G3','B3','D4'], ['A3','C4','E4'], ['F3','A3','C4'],
    ];

    // Hooky melody
    const melody = [
      { n:'E5', beat: 3.5, len: 0.5 }, { n:'G5', beat: 4.0, len: 0.5 }, { n:'A5', beat: 4.5, len: 0.5 },
      { n:'G5', beat: 5.0, len: 0.5 }, { n:'E5', beat: 5.5, len: 0.5 }, { n:'D5', beat: 6.0, len: 0.75 },
      { n:'A5', beat: 8.0, len: 0.5 }, { n:'C6', beat: 8.5, len: 0.5 }, { n:'B5', beat: 9.0, len: 0.75 },
      { n:'A5', beat: 12.0, len: 0.5 }, { n:'G5', beat: 12.5, len: 0.5 }, { n:'E5', beat: 13.0, len: 1.0 },
      { n:'E5', beat: 15.5, len: 0.5 }, { n:'G5', beat: 16.0, len: 0.5 }, { n:'A5', beat: 16.5, len: 0.5 },
      { n:'B5', beat: 17.0, len: 0.5 }, { n:'A5', beat: 17.5, len: 0.5 }, { n:'G5', beat: 18.0, len: 0.75 },
      { n:'A5', beat: 20.0, len: 0.5 }, { n:'C6', beat: 20.5, len: 0.5 }, { n:'E6', beat: 21.0, len: 0.5 },
      { n:'D6', beat: 24.0, len: 0.5 }, { n:'C6', beat: 24.5, len: 0.5 }, { n:'G5', beat: 25.0, len: 1.0 },
    ];

    // Counter melody
    const countermel = [
      { n:'C5', beat: 1.0, len: 0.5 }, { n:'B4', beat: 2.0, len: 0.5 }, { n:'A4', beat: 3.0, len: 0.5 },
      { n:'G4', beat: 6.5, len: 0.5 },
      { n:'E5', beat: 9.5, len: 0.5 },
      { n:'F5', beat: 13.5, len: 0.5 },
      { n:'E5', beat: 18.5, len: 0.5 }, { n:'D5', beat: 19.5, len: 0.5 },
      { n:'C5', beat: 22.5, len: 0.5 }, { n:'A4', beat: 23.5, len: 0.5 },
    ];

    // Bass line
    const bass = [
      { n:'C3', beat: 0.0, len: 0.9 }, { n:'C3', beat: 1.0, len: 0.9 }, { n:'C3', beat: 2.0, len: 0.9 }, { n:'B2', beat: 3.0, len: 0.9 },
      { n:'G2', beat: 4.0, len: 0.9 }, { n:'G2', beat: 5.0, len: 0.9 }, { n:'G2', beat: 6.0, len: 0.9 }, { n:'G2', beat: 7.0, len: 0.9 },
      { n:'A2', beat: 8.0, len: 0.9 }, { n:'A2', beat: 9.0, len: 0.9 }, { n:'A2', beat:10.0, len: 0.9 }, { n:'G2', beat:11.0, len: 0.9 },
      { n:'F2', beat:12.0, len: 0.9 }, { n:'F2', beat:13.0, len: 0.9 }, { n:'F2', beat:14.0, len: 0.9 }, { n:'G2', beat:15.0, len: 0.9 },
      { n:'C3', beat:16.0, len: 0.9 }, { n:'C3', beat:17.0, len: 0.9 }, { n:'C3', beat:18.0, len: 0.9 }, { n:'B2', beat:19.0, len: 0.9 },
      { n:'G2', beat:20.0, len: 0.9 }, { n:'G2', beat:21.0, len: 0.9 }, { n:'G2', beat:22.0, len: 0.9 }, { n:'G2', beat:23.0, len: 0.9 },
      { n:'A2', beat:24.0, len: 0.9 }, { n:'A2', beat:25.0, len: 0.9 }, { n:'A2', beat:26.0, len: 0.9 }, { n:'G2', beat:27.0, len: 0.9 },
      { n:'F2', beat:28.0, len: 0.9 }, { n:'F2', beat:29.0, len: 0.9 }, { n:'F2', beat:30.0, len: 0.9 }, { n:'G2', beat:31.0, len: 0.9 },
    ];

    // Chord arpeggios
    const makeChordPart = () => {
      const part = [];
      for(let bar=0; bar<8; bar++){
        const chord = CHORDS[bar];
        for(let step=0; step<8; step++){
          const n = chord[step % chord.length];
          part.push({ n, beat: bar*4 + (step*0.5), len: 0.45 });
        }
      }
      return part;
    };
    const chords = makeChordPart();

    // Play a tone with envelope
    const playTone = (
      freq: number,
      time: number,
      dur: number,
      type: OscillatorType = 'sine',
      vel: number = 0.9
    ) => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.connect(gain);
      gain.connect(this.audioContext.destination);

      osc.type = type;
      osc.frequency.setValueAtTime(freq, time);

      // ADSR envelope
      const peak = this.masterVolume * vel * 0.15;
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(peak, time + 0.004);
      gain.gain.linearRampToValueAtTime(peak * 0.6, time + 0.08);
      gain.gain.setTargetAtTime(0, time + Math.max(dur - 0.08, 0.08), 0.08);

      osc.start(time);
      osc.stop(time + dur + 0.2);
    };

    // Schedule a part
    const schedulePart = (
      part: Array<{n: string, beat: number, len: number}>,
      type: OscillatorType,
      vel: number
    ) => {
      const start = this.audioContext.currentTime + 0.1;
      for(const ev of part){
        const t = start + ev.beat * beat;
        playTone(f(ev.n), t, ev.len * beat, type, vel);
      }
    };

    const loopDuration = 32 * beat; // 8 bars * 4 beats

    const loopMusic = () => {
      if (!this.musicPlaying) return;

      schedulePart(bass, 'sine', 0.9);
      schedulePart(chords, 'square', 0.35);
      schedulePart(countermel, 'triangle', 0.5);
      schedulePart(melody, 'sawtooth', 0.55);

      this.musicIntervalId = window.setTimeout(loopMusic, loopDuration * 1000 - 50);
    };

    loopMusic();
  }

  public stopBackgroundMusic(): void {
    this.musicPlaying = false;
    if (this.musicIntervalId !== null) {
      clearTimeout(this.musicIntervalId);
      this.musicIntervalId = null;
    }
  }

  // Resume audio context (needed for browser autoplay policies)
  public resume(): void {
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }
}
