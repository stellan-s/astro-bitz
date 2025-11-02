export class AudioManager {
  private audioContext: AudioContext;
  private masterVolume: number = 0.3;
  private musicPlaying: boolean = false;
  private musicIntervalId: number | null = null;
  private bossMusic: boolean = false;
  private shepardOscillators: OscillatorNode[] = [];
  private shepardGains: GainNode[] = [];
  private shepardTimeoutId: number | null = null;

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

  // Missile launch sound - powerful whoosh with ignition
  public playMissileLaunch(): void {
    const now = this.audioContext.currentTime;

    // Ignition sound - quick rising tone
    const ignition = this.audioContext.createOscillator();
    const ignitionGain = this.audioContext.createGain();

    ignition.connect(ignitionGain);
    ignitionGain.connect(this.audioContext.destination);

    ignition.type = 'sawtooth';
    ignition.frequency.setValueAtTime(100, now);
    ignition.frequency.exponentialRampToValueAtTime(600, now + 0.15);

    ignitionGain.gain.setValueAtTime(this.masterVolume * 0.5, now);
    ignitionGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    ignition.start(now);
    ignition.stop(now + 0.15);

    // Rocket whoosh - sustained mid-tone with modulation
    const whoosh = this.audioContext.createOscillator();
    const whooshGain = this.audioContext.createGain();
    const whooshFilter = this.audioContext.createBiquadFilter();

    whoosh.connect(whooshFilter);
    whooshFilter.connect(whooshGain);
    whooshGain.connect(this.audioContext.destination);

    whooshFilter.type = 'bandpass';
    whooshFilter.frequency.setValueAtTime(400, now + 0.1);
    whooshFilter.Q.setValueAtTime(2, now + 0.1);

    whoosh.type = 'triangle';
    whoosh.frequency.setValueAtTime(300, now + 0.1);
    whoosh.frequency.linearRampToValueAtTime(500, now + 0.4);

    whooshGain.gain.setValueAtTime(0, now + 0.1);
    whooshGain.gain.linearRampToValueAtTime(this.masterVolume * 0.4, now + 0.15);
    whooshGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    whoosh.start(now + 0.1);
    whoosh.stop(now + 0.5);

    // High-frequency sizzle for rocket exhaust
    const sizzle = this.audioContext.createOscillator();
    const sizzleGain = this.audioContext.createGain();

    sizzle.connect(sizzleGain);
    sizzleGain.connect(this.audioContext.destination);

    sizzle.type = 'square';
    sizzle.frequency.setValueAtTime(2000, now + 0.05);
    sizzle.frequency.exponentialRampToValueAtTime(1500, now + 0.4);

    sizzleGain.gain.setValueAtTime(this.masterVolume * 0.15, now + 0.05);
    sizzleGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    sizzle.start(now + 0.05);
    sizzle.stop(now + 0.4);
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

  // Powerup sound - ascending chime with harmonics
  public playPowerUp(): void {
    const now = this.audioContext.currentTime;

    // Create multiple oscillators for a richer sound
    const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5 - major chord

    frequencies.forEach((baseFreq, index) => {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.type = 'sine';
      const startTime = now + index * 0.05; // Slight delay for arpeggio effect

      oscillator.frequency.setValueAtTime(baseFreq, startTime);
      oscillator.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, startTime + 0.2);

      const volume = this.masterVolume * 0.3 * (1 - index * 0.2); // Decreasing volume
      gainNode.gain.setValueAtTime(volume, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.3);
    });

    // Add a sparkle effect with higher frequency
    const sparkle = this.audioContext.createOscillator();
    const sparkleGain = this.audioContext.createGain();

    sparkle.connect(sparkleGain);
    sparkleGain.connect(this.audioContext.destination);

    sparkle.type = 'triangle';
    sparkle.frequency.setValueAtTime(1500, now + 0.1);
    sparkle.frequency.exponentialRampToValueAtTime(3000, now + 0.25);

    sparkleGain.gain.setValueAtTime(this.masterVolume * 0.15, now + 0.1);
    sparkleGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    sparkle.start(now + 0.1);
    sparkle.stop(now + 0.25);
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

  // Start boss music with Shepard tone (infinitely rising tension)
  public startBossMusic(): void {
    if (this.bossMusic) return;

    // Stop regular music first
    this.stopBackgroundMusic();
    this.bossMusic = true;

    // Shepard tone: multiple octaves of the same pitch class cycling
    // Creates illusion of infinitely rising pitch (subtle background tension)
    const baseFreq = 55; // A1
    const numOctaves = 6;

    for (let i = 0; i < numOctaves; i++) {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.connect(gain);
      gain.connect(this.audioContext.destination);

      osc.type = 'sine';
      const freq = baseFreq * Math.pow(2, i);
      osc.frequency.setValueAtTime(freq, this.audioContext.currentTime);

      // Bell curve envelope: fade in and out to create seamless loop
      // Lowest and highest octaves are quieter
      // Reduced volume from 0.15 to 0.06 to make it more subtle
      const bellCurve = Math.exp(-Math.pow((i - numOctaves / 2), 2) / (numOctaves / 2));
      gain.gain.setValueAtTime(this.masterVolume * 0.06 * bellCurve, this.audioContext.currentTime);

      osc.start(this.audioContext.currentTime);

      this.shepardOscillators.push(osc);
      this.shepardGains.push(gain);
    }

    // Animate the Shepard tone
    this.animateShepardTone();

    // Add dramatic bass and rhythm to accompany the Shepard tone
    this.playBossRhythm();
  }

  private animateShepardTone(): void {
    if (!this.bossMusic) return;

    const now = this.audioContext.currentTime;
    const riseDuration = 8; // 8 seconds to rise one octave
    const baseFreq = 55;
    const numOctaves = this.shepardOscillators.length;

    for (let i = 0; i < numOctaves; i++) {
      const osc = this.shepardOscillators[i];
      const gain = this.shepardGains[i];

      // Each oscillator rises by one octave
      const startFreq = baseFreq * Math.pow(2, i);
      const endFreq = startFreq * 2;

      osc.frequency.cancelScheduledValues(now);
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + riseDuration);

      // Fade envelope: fade out highest, fade in lowest (creates seamless loop)
      gain.gain.cancelScheduledValues(now);

      // Position in the cycle (0 to 1)
      const cyclePos = i / numOctaves;

      // Bell curve that moves through the octaves
      const peakPos = 0.5; // Peak at middle
      const bellWidth = 0.4;
      const distance = Math.abs(cyclePos - peakPos);
      const bellCurve = Math.exp(-Math.pow(distance / bellWidth, 2));

      gain.gain.setValueAtTime(this.masterVolume * 0.06 * bellCurve, now);

      // Fade out at the end, fade in at the beginning
      const nextBellCurve = i === 0 ?
        Math.exp(-Math.pow((1 - peakPos) / bellWidth, 2)) : // Will wrap to highest
        Math.exp(-Math.pow(((i - 1) / numOctaves - peakPos) / bellWidth, 2));

      gain.gain.linearRampToValueAtTime(this.masterVolume * 0.06 * nextBellCurve, now + riseDuration);
    }

    // Loop the animation
    this.shepardTimeoutId = window.setTimeout(() => {
      if (this.bossMusic) {
        // Restart the lowest oscillator at the bottom when it reaches the top
        const lowestOsc = this.shepardOscillators[0];
        lowestOsc.frequency.setValueAtTime(baseFreq, this.audioContext.currentTime);

        this.animateShepardTone();
      }
    }, riseDuration * 1000);
  }

  private playBossRhythm(): void {
    if (!this.bossMusic) return;

    const now = this.audioContext.currentTime;
    const beatDuration = 0.5; // 120 BPM

    // Deep bass kick on beats 1 and 3
    for (let beat = 0; beat < 8; beat += 2) {
      const time = now + beat * beatDuration;
      const bass = this.audioContext.createOscillator();
      const bassGain = this.audioContext.createGain();

      bass.connect(bassGain);
      bassGain.connect(this.audioContext.destination);

      bass.type = 'sine';
      bass.frequency.setValueAtTime(55, time); // Deep A1
      bass.frequency.exponentialRampToValueAtTime(40, time + 0.1);

      bassGain.gain.setValueAtTime(this.masterVolume * 0.25, time);
      bassGain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

      bass.start(time);
      bass.stop(time + 0.2);
    }

    // Hi-hat on every beat
    for (let beat = 0; beat < 8; beat++) {
      const time = now + beat * beatDuration;
      const hihat = this.audioContext.createOscillator();
      const hihatGain = this.audioContext.createGain();

      hihat.connect(hihatGain);
      hihatGain.connect(this.audioContext.destination);

      hihat.type = 'square';
      hihat.frequency.setValueAtTime(8000, time);

      hihatGain.gain.setValueAtTime(this.masterVolume * 0.03, time);
      hihatGain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

      hihat.start(time);
      hihat.stop(time + 0.05);
    }

    // Ominous low melody
    const melodyNotes = [110, 116.54, 130.81, 123.47]; // A2, A#2, C3, B2
    for (let i = 0; i < melodyNotes.length; i++) {
      const time = now + i * beatDuration * 2;
      const melody = this.audioContext.createOscillator();
      const melodyGain = this.audioContext.createGain();

      melody.connect(melodyGain);
      melodyGain.connect(this.audioContext.destination);

      melody.type = 'sawtooth';
      melody.frequency.setValueAtTime(melodyNotes[i], time);

      melodyGain.gain.setValueAtTime(this.masterVolume * 0.08, time);
      melodyGain.gain.setTargetAtTime(0.001, time + 0.3, 0.3);

      melody.start(time);
      melody.stop(time + 0.9);
    }

    // Loop the rhythm every 4 seconds (8 beats)
    setTimeout(() => {
      if (this.bossMusic) {
        this.playBossRhythm();
      }
    }, 4000);
  }

  public stopBossMusic(): void {
    this.bossMusic = false;

    // Clear any pending animation timeout
    if (this.shepardTimeoutId !== null) {
      clearTimeout(this.shepardTimeoutId);
      this.shepardTimeoutId = null;
    }

    // Stop all Shepard tone oscillators
    for (const osc of this.shepardOscillators) {
      try {
        osc.stop();
      } catch (e) {
        // Oscillator might already be stopped
      }
    }

    this.shepardOscillators = [];
    this.shepardGains = [];
  }

  // Resume audio context (needed for browser autoplay policies)
  public resume(): void {
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }
}
