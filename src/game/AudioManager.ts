export class AudioManager {
  private audioContext: AudioContext;
  private masterVolume: number = 0.3;
  private musicPlaying: boolean = false;
  private musicIntervalId: number | null = null;
  private bossMusic: boolean = false;
  private shepardOscillators: OscillatorNode[] = [];
  private shepardGains: GainNode[] = [];
  private shepardTimeoutId: number | null = null;
  private shepardBaseFreq: number = 55; // Store the base frequency for Shepard tone

  // Dynamic music intensity
  private drumsGainNode: GainNode | null = null;
  private drumsEnabled: boolean = false;

  // Audio node pooling for battery optimization
  private gainPool: GainNode[] = [];
  private poolSize: number = 20; // Reuse up to 20 nodes

  constructor() {
    this.audioContext = new AudioContext();
    this.initializePool();
  }

  // Initialize pools of reusable audio nodes
  private initializePool(): void {
    for (let i = 0; i < this.poolSize; i++) {
      this.gainPool.push(this.audioContext.createGain());
    }
  }

  // Get oscillator and gain from pool or create new ones
  private getAudioNodes(): { oscillator: OscillatorNode; gain: GainNode } {
    const gain = this.gainPool.pop() || this.audioContext.createGain();
    const oscillator = this.audioContext.createOscillator();

    // Reset gain values
    gain.gain.cancelScheduledValues(0);
    gain.gain.value = 0;

    return { oscillator, gain };
  }

  // Return gain node to pool after use
  private returnGainToPool(gain: GainNode, delay: number): void {
    setTimeout(() => {
      // Disconnect and reset
      try {
        gain.disconnect();
        gain.gain.cancelScheduledValues(0);
        gain.gain.value = 0;

        // Only return to pool if not at capacity
        if (this.gainPool.length < this.poolSize) {
          this.gainPool.push(gain);
        }
      } catch (e) {
        // Ignore errors if already disconnected
      }
    }, delay * 1000);
  }

  // Shooting sound - pew pew laser
  public playShoot(): void {
    const { oscillator, gain } = this.getAudioNodes();

    oscillator.connect(gain);
    gain.connect(this.audioContext.destination);

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.1);

    gain.gain.setValueAtTime(this.masterVolume * 0.3, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.1);

    // Return gain to pool after sound completes
    this.returnGainToPool(gain, 0.15);
  }

  // Missile launch sound - powerful whoosh with ignition
  public playMissileLaunch(): void {
    const now = this.audioContext.currentTime;

    // Ignition sound - quick rising tone
    const { oscillator: ignition, gain: ignitionGain } = this.getAudioNodes();

    ignition.connect(ignitionGain);
    ignitionGain.connect(this.audioContext.destination);

    ignition.type = 'sawtooth';
    ignition.frequency.setValueAtTime(100, now);
    ignition.frequency.exponentialRampToValueAtTime(600, now + 0.15);

    ignitionGain.gain.setValueAtTime(this.masterVolume * 0.5, now);
    ignitionGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    ignition.start(now);
    ignition.stop(now + 0.15);
    this.returnGainToPool(ignitionGain, 0.2);

    // Rocket whoosh - sustained mid-tone with modulation
    const { oscillator: whoosh, gain: whooshGain } = this.getAudioNodes();
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
    this.returnGainToPool(whooshGain, 0.6);

    // High-frequency sizzle for rocket exhaust
    const { oscillator: sizzle, gain: sizzleGain } = this.getAudioNodes();

    sizzle.connect(sizzleGain);
    sizzleGain.connect(this.audioContext.destination);

    sizzle.type = 'square';
    sizzle.frequency.setValueAtTime(2000, now + 0.05);
    sizzle.frequency.exponentialRampToValueAtTime(1500, now + 0.4);

    sizzleGain.gain.setValueAtTime(this.masterVolume * 0.15, now + 0.05);
    sizzleGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    sizzle.start(now + 0.05);
    sizzle.stop(now + 0.4);
    this.returnGainToPool(sizzleGain, 0.5);
  }

  // Hit sound - explosion with enemy-specific variations
  public playHit(enemyType?: string): void {
    const now = this.audioContext.currentTime;

    // Different sounds based on enemy type
    switch (enemyType) {
      case 'basic':
        this.playBasicHit(now);
        break;
      case 'fast':
        this.playFastHit(now);
        break;
      case 'tank':
        this.playTankHit(now);
        break;
      case 'weaver':
        this.playWeaverHit(now);
        break;
      case 'spinner':
        this.playSpinnerHit(now);
        break;
      case 'dasher':
        this.playDasherHit(now);
        break;
      case 'stealth':
        this.playStealthHit(now);
        break;
      case 'kamikaze':
        this.playKamikazeHit(now);
        break;
      case 'boss':
      case 'bossSniper':
      case 'bossTank':
      case 'bossSwarm':
        this.playBossHit(now);
        break;
      default:
        // Default explosion sound
        this.playBasicHit(now);
        break;
    }
  }

  // Basic enemy - standard explosion
  private playBasicHit(now: number): void {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(200, now);
    oscillator.frequency.exponentialRampToValueAtTime(50, now + 0.15);

    gainNode.gain.setValueAtTime(this.masterVolume * 0.4, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    oscillator.start(now);
    oscillator.stop(now + 0.15);
  }

  // Fast enemy - higher pitched, quick snap
  private playFastHit(now: number): void {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(500, now);
    oscillator.frequency.exponentialRampToValueAtTime(150, now + 0.08);

    gainNode.gain.setValueAtTime(this.masterVolume * 0.35, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    oscillator.start(now);
    oscillator.stop(now + 0.08);
  }

  // Tank enemy - deep, heavy thud with metal clang
  private playTankHit(now: number): void {
    // Deep thud
    const thud = this.audioContext.createOscillator();
    const thudGain = this.audioContext.createGain();

    thud.connect(thudGain);
    thudGain.connect(this.audioContext.destination);

    thud.type = 'sine';
    thud.frequency.setValueAtTime(80, now);
    thud.frequency.exponentialRampToValueAtTime(30, now + 0.25);

    thudGain.gain.setValueAtTime(this.masterVolume * 0.6, now);
    thudGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    thud.start(now);
    thud.stop(now + 0.25);

    // Metal clang
    const clang = this.audioContext.createOscillator();
    const clanGain = this.audioContext.createGain();

    clang.connect(clanGain);
    clanGain.connect(this.audioContext.destination);

    clang.type = 'square';
    clang.frequency.setValueAtTime(800, now + 0.02);
    clang.frequency.exponentialRampToValueAtTime(200, now + 0.15);

    clanGain.gain.setValueAtTime(this.masterVolume * 0.3, now + 0.02);
    clanGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    clang.start(now + 0.02);
    clang.stop(now + 0.15);
  }

  // Weaver enemy - warbling, modulated sound
  private playWeaverHit(now: number): void {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const lfo = this.audioContext.createOscillator();
    const lfoGain = this.audioContext.createGain();

    // LFO for warble effect
    lfo.connect(lfoGain);
    lfoGain.connect(oscillator.frequency);
    lfo.frequency.setValueAtTime(30, now);
    lfoGain.gain.setValueAtTime(40, now);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(300, now);

    gainNode.gain.setValueAtTime(this.masterVolume * 0.4, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

    lfo.start(now);
    lfo.stop(now + 0.18);
    oscillator.start(now);
    oscillator.stop(now + 0.18);
  }

  // Spinner enemy - spinning down sound
  private playSpinnerHit(now: number): void {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.type = 'sawtooth';
    // Rapidly descending pitch like a spinning object losing power
    oscillator.frequency.setValueAtTime(800, now);
    oscillator.frequency.exponentialRampToValueAtTime(100, now + 0.3);

    gainNode.gain.setValueAtTime(this.masterVolume * 0.45, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    oscillator.start(now);
    oscillator.stop(now + 0.3);
  }

  // Dasher enemy - sharp crack with whoosh
  private playDasherHit(now: number): void {
    // Sharp crack
    const crack = this.audioContext.createOscillator();
    const crackGain = this.audioContext.createGain();

    crack.connect(crackGain);
    crackGain.connect(this.audioContext.destination);

    crack.type = 'square';
    crack.frequency.setValueAtTime(1200, now);
    crack.frequency.exponentialRampToValueAtTime(300, now + 0.05);

    crackGain.gain.setValueAtTime(this.masterVolume * 0.4, now);
    crackGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

    crack.start(now);
    crack.stop(now + 0.05);

    // Trailing whoosh
    const whoosh = this.audioContext.createOscillator();
    const whooshGain = this.audioContext.createGain();

    whoosh.connect(whooshGain);
    whooshGain.connect(this.audioContext.destination);

    whoosh.type = 'triangle';
    whoosh.frequency.setValueAtTime(400, now + 0.03);
    whoosh.frequency.exponentialRampToValueAtTime(100, now + 0.2);

    whooshGain.gain.setValueAtTime(this.masterVolume * 0.3, now + 0.03);
    whooshGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    whoosh.start(now + 0.03);
    whoosh.stop(now + 0.2);
  }

  // Stealth enemy - muffled, electronic glitch
  private playStealthHit(now: number): void {
    // Electronic glitch
    const glitch = this.audioContext.createOscillator();
    const glitchGain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    glitch.connect(filter);
    filter.connect(glitchGain);
    glitchGain.connect(this.audioContext.destination);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.12);

    glitch.type = 'square';
    glitch.frequency.setValueAtTime(250, now);
    glitch.frequency.setValueAtTime(180, now + 0.04);
    glitch.frequency.setValueAtTime(300, now + 0.08);

    glitchGain.gain.setValueAtTime(this.masterVolume * 0.35, now);
    glitchGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    glitch.start(now);
    glitch.stop(now + 0.12);
  }

  // Kamikaze enemy - explosive impact with ascending pitch
  private playKamikazeHit(now: number): void {
    // Sharp explosion
    const explosion = this.audioContext.createOscillator();
    const explosionGain = this.audioContext.createGain();

    explosion.connect(explosionGain);
    explosionGain.connect(this.audioContext.destination);

    explosion.type = 'sawtooth';
    explosion.frequency.setValueAtTime(150, now);
    explosion.frequency.exponentialRampToValueAtTime(600, now + 0.08); // Rising pitch for impact
    explosion.frequency.exponentialRampToValueAtTime(100, now + 0.2); // Then drops

    explosionGain.gain.setValueAtTime(this.masterVolume * 0.5, now);
    explosionGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    explosion.start(now);
    explosion.stop(now + 0.2);

    // Sizzle/burn effect
    const sizzle = this.audioContext.createOscillator();
    const sizzleGain = this.audioContext.createGain();

    sizzle.connect(sizzleGain);
    sizzleGain.connect(this.audioContext.destination);

    sizzle.type = 'square';
    sizzle.frequency.setValueAtTime(2500, now + 0.05);
    sizzle.frequency.exponentialRampToValueAtTime(1000, now + 0.25);

    sizzleGain.gain.setValueAtTime(this.masterVolume * 0.3, now + 0.05);
    sizzleGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    sizzle.start(now + 0.05);
    sizzle.stop(now + 0.25);
  }

  // Boss enemy - massive explosion with rumble
  private playBossHit(now: number): void {
    // Deep rumble
    const rumble = this.audioContext.createOscillator();
    const rumbleGain = this.audioContext.createGain();

    rumble.connect(rumbleGain);
    rumbleGain.connect(this.audioContext.destination);

    rumble.type = 'sine';
    rumble.frequency.setValueAtTime(60, now);
    rumble.frequency.exponentialRampToValueAtTime(25, now + 0.4);

    rumbleGain.gain.setValueAtTime(this.masterVolume * 0.7, now);
    rumbleGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    rumble.start(now);
    rumble.stop(now + 0.4);

    // Explosion crack
    const explosion = this.audioContext.createOscillator();
    const explosionGain = this.audioContext.createGain();

    explosion.connect(explosionGain);
    explosionGain.connect(this.audioContext.destination);

    explosion.type = 'sawtooth';
    explosion.frequency.setValueAtTime(400, now);
    explosion.frequency.exponentialRampToValueAtTime(80, now + 0.3);

    explosionGain.gain.setValueAtTime(this.masterVolume * 0.5, now);
    explosionGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    explosion.start(now);
    explosion.stop(now + 0.3);

    // High-frequency debris
    const debris = this.audioContext.createOscillator();
    const debrisGain = this.audioContext.createGain();

    debris.connect(debrisGain);
    debrisGain.connect(this.audioContext.destination);

    debris.type = 'square';
    debris.frequency.setValueAtTime(2000, now + 0.05);
    debris.frequency.exponentialRampToValueAtTime(500, now + 0.35);

    debrisGain.gain.setValueAtTime(this.masterVolume * 0.3, now + 0.05);
    debrisGain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    debris.start(now + 0.05);
    debris.stop(now + 0.35);
  }

  // Game over sound - descending tone
  public playGameOver(): void {
    // Death jingle inspired by Super Mario - a short melodic sequence (raised one octave)
    const now = this.audioContext.currentTime;

    // Notes for the death jingle (in Hz): B5, F#5, D#5, A4, C#5, E4, C4, E4, C4
    // Raised one octave by multiplying frequencies by 2
    const notes = [
      { freq: 987.77, start: 0.00, duration: 0.15 },    // B5
      { freq: 739.99, start: 0.15, duration: 0.15 },    // F#5
      { freq: 622.25, start: 0.30, duration: 0.15 },    // D#5
      { freq: 440.00, start: 0.45, duration: 0.15 },    // A4
      { freq: 554.37, start: 0.60, duration: 0.15 },    // C#5
      { freq: 329.63, start: 0.75, duration: 0.20 },    // E4
      { freq: 261.63, start: 0.95, duration: 0.20 },    // C4
      { freq: 329.63, start: 1.15, duration: 0.20 },    // E4
      { freq: 261.63, start: 1.35, duration: 0.40 },    // C4 (held longer)
    ];

    notes.forEach(note => {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.type = 'square'; // Square wave for retro sound
      oscillator.frequency.setValueAtTime(note.freq, now + note.start);

      // Envelope: quick attack, sustain, then fade (reduced volume to 10%)
      gainNode.gain.setValueAtTime(0, now + note.start);
      gainNode.gain.linearRampToValueAtTime(this.masterVolume * 0.10, now + note.start + 0.02);
      gainNode.gain.setValueAtTime(this.masterVolume * 0.10, now + note.start + note.duration - 0.05);
      gainNode.gain.linearRampToValueAtTime(0.01, now + note.start + note.duration);

      oscillator.start(now + note.start);
      oscillator.stop(now + note.start + note.duration);
    });
  }

  // Shield break sound - sharp crack with descending tone
  public playShieldBreak(): void {
    const now = this.audioContext.currentTime;

    // Sharp crack
    const crack = this.audioContext.createOscillator();
    const crackGain = this.audioContext.createGain();

    crack.connect(crackGain);
    crackGain.connect(this.audioContext.destination);

    crack.type = 'square';
    crack.frequency.setValueAtTime(1500, now);
    crack.frequency.exponentialRampToValueAtTime(400, now + 0.1);

    crackGain.gain.setValueAtTime(this.masterVolume * 0.35, now);
    crackGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    crack.start(now);
    crack.stop(now + 0.1);

    // Glass shatter effect
    const shatter = this.audioContext.createOscillator();
    const shatterGain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    shatter.connect(filter);
    filter.connect(shatterGain);
    shatterGain.connect(this.audioContext.destination);

    filter.type = 'highpass';
    filter.frequency.setValueAtTime(2000, now);

    shatter.type = 'square';
    shatter.frequency.setValueAtTime(3000, now + 0.02);
    shatter.frequency.exponentialRampToValueAtTime(800, now + 0.15);

    shatterGain.gain.setValueAtTime(this.masterVolume * 0.25, now + 0.02);
    shatterGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    shatter.start(now + 0.02);
    shatter.stop(now + 0.15);
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
  public startBackgroundMusic(waveNumber: number = 1): void {
    if (this.musicPlaying) return;
    this.musicPlaying = true;

    const isEvenWave = waveNumber % 2 === 0;

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

    // Slightly faster tempo on even waves for more intensity
    const BPM = isEvenWave ? 104 : 96;
    const beat = 60 / BPM;

    // --- Progression: C | G | Am | F | C | G | Am | F ---
    const CHORDS = [
      ['C4','E4','G4'], ['G3','B3','D4'], ['A3','C4','E4'], ['F3','A3','C4'],
      ['C4','E4','G4'], ['G3','B3','D4'], ['A3','C4','E4'], ['F3','A3','C4'],
    ];

    // Hooky melody - original for odd waves
    const melodyOdd = [
      { n:'E5', beat: 3.5, len: 0.5 }, { n:'G5', beat: 4.0, len: 0.5 }, { n:'A5', beat: 4.5, len: 0.5 },
      { n:'G5', beat: 5.0, len: 0.5 }, { n:'E5', beat: 5.5, len: 0.5 }, { n:'D5', beat: 6.0, len: 0.75 },
      { n:'A5', beat: 8.0, len: 0.5 }, { n:'C6', beat: 8.5, len: 0.5 }, { n:'B5', beat: 9.0, len: 0.75 },
      { n:'A5', beat: 12.0, len: 0.5 }, { n:'G5', beat: 12.5, len: 0.5 }, { n:'E5', beat: 13.0, len: 1.0 },
      { n:'E5', beat: 15.5, len: 0.5 }, { n:'G5', beat: 16.0, len: 0.5 }, { n:'A5', beat: 16.5, len: 0.5 },
      { n:'B5', beat: 17.0, len: 0.5 }, { n:'A5', beat: 17.5, len: 0.5 }, { n:'G5', beat: 18.0, len: 0.75 },
      { n:'A5', beat: 20.0, len: 0.5 }, { n:'C6', beat: 20.5, len: 0.5 }, { n:'E6', beat: 21.0, len: 0.5 },
      { n:'D6', beat: 24.0, len: 0.5 }, { n:'C6', beat: 24.5, len: 0.5 }, { n:'G5', beat: 25.0, len: 1.0 },
    ];

    // Alternative melody for even waves - more intense and higher
    const melodyEven = [
      { n:'G5', beat: 3.5, len: 0.5 }, { n:'A5', beat: 4.0, len: 0.5 }, { n:'C6', beat: 4.5, len: 0.5 },
      { n:'B5', beat: 5.0, len: 0.5 }, { n:'G5', beat: 5.5, len: 0.5 }, { n:'E5', beat: 6.0, len: 0.75 },
      { n:'C6', beat: 8.0, len: 0.5 }, { n:'D6', beat: 8.5, len: 0.5 }, { n:'E6', beat: 9.0, len: 0.75 },
      { n:'D6', beat: 12.0, len: 0.5 }, { n:'B5', beat: 12.5, len: 0.5 }, { n:'G5', beat: 13.0, len: 1.0 },
      { n:'A5', beat: 15.5, len: 0.5 }, { n:'B5', beat: 16.0, len: 0.5 }, { n:'C6', beat: 16.5, len: 0.5 },
      { n:'D6', beat: 17.0, len: 0.5 }, { n:'C6', beat: 17.5, len: 0.5 }, { n:'B5', beat: 18.0, len: 0.75 },
      { n:'C6', beat: 20.0, len: 0.5 }, { n:'E6', beat: 20.5, len: 0.5 }, { n:'G6', beat: 21.0, len: 0.5 },
      { n:'E6', beat: 24.0, len: 0.5 }, { n:'D6', beat: 24.5, len: 0.5 }, { n:'C6', beat: 25.0, len: 1.0 },
    ];

    const melody = isEvenWave ? melodyEven : melodyOdd;

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

    // Drum layer function (always scheduled, volume controlled by gain node)
    const scheduleDrums = () => {
      const start = this.audioContext.currentTime + 0.1;

      // Enhanced drum pattern with kicks, snares, and hi-hats
      const drumPattern = [
        // Bar 1
        { beat: 0, type: 'kick' }, { beat: 0.5, type: 'hihat' },
        { beat: 1, type: 'snare' }, { beat: 1.5, type: 'hihat' },
        { beat: 2, type: 'kick' }, { beat: 2.5, type: 'hihat' },
        { beat: 3, type: 'snare' }, { beat: 3.5, type: 'hihat' },
        // Bar 2
        { beat: 4, type: 'kick' }, { beat: 4.5, type: 'hihat' },
        { beat: 5, type: 'snare' }, { beat: 5.5, type: 'hihat' },
        { beat: 6, type: 'kick' }, { beat: 6.5, type: 'hihat' }, { beat: 6.75, type: 'kick' },
        { beat: 7, type: 'snare' }, { beat: 7.5, type: 'hihat' },
        // Bar 3
        { beat: 8, type: 'kick' }, { beat: 8.5, type: 'hihat' },
        { beat: 9, type: 'snare' }, { beat: 9.5, type: 'hihat' },
        { beat: 10, type: 'kick' }, { beat: 10.5, type: 'hihat' },
        { beat: 11, type: 'snare' }, { beat: 11.5, type: 'hihat' },
        // Bar 4
        { beat: 12, type: 'kick' }, { beat: 12.5, type: 'hihat' },
        { beat: 13, type: 'snare' }, { beat: 13.5, type: 'hihat' },
        { beat: 14, type: 'kick' }, { beat: 14.5, type: 'hihat' }, { beat: 14.75, type: 'kick' },
        { beat: 15, type: 'snare' }, { beat: 15.5, type: 'hihat' },
        // Bar 5
        { beat: 16, type: 'kick' }, { beat: 16.5, type: 'hihat' },
        { beat: 17, type: 'snare' }, { beat: 17.5, type: 'hihat' },
        { beat: 18, type: 'kick' }, { beat: 18.5, type: 'hihat' },
        { beat: 19, type: 'snare' }, { beat: 19.5, type: 'hihat' },
        // Bar 6
        { beat: 20, type: 'kick' }, { beat: 20.5, type: 'hihat' },
        { beat: 21, type: 'snare' }, { beat: 21.5, type: 'hihat' },
        { beat: 22, type: 'kick' }, { beat: 22.5, type: 'hihat' }, { beat: 22.75, type: 'kick' },
        { beat: 23, type: 'snare' }, { beat: 23.5, type: 'hihat' },
        // Bar 7
        { beat: 24, type: 'kick' }, { beat: 24.5, type: 'hihat' },
        { beat: 25, type: 'snare' }, { beat: 25.5, type: 'hihat' },
        { beat: 26, type: 'kick' }, { beat: 26.5, type: 'hihat' },
        { beat: 27, type: 'snare' }, { beat: 27.5, type: 'hihat' },
        // Bar 8 - fill
        { beat: 28, type: 'kick' }, { beat: 28.5, type: 'hihat' },
        { beat: 29, type: 'snare' }, { beat: 29.5, type: 'hihat' },
        { beat: 30, type: 'kick' }, { beat: 30.25, type: 'snare' }, { beat: 30.5, type: 'kick' },
        { beat: 31, type: 'snare' }, { beat: 31.5, type: 'snare' },
      ];

      for (const drum of drumPattern) {
        const time = start + drum.beat * beat;

        if (drum.type === 'kick') {
          // Kick drum - deep thump
          const kick = this.audioContext.createOscillator();
          const kickGain = this.audioContext.createGain();

          kick.connect(kickGain);

          // Connect to drums gain node for volume control
          if (!this.drumsGainNode) {
            this.drumsGainNode = this.audioContext.createGain();
            this.drumsGainNode.connect(this.audioContext.destination);
            this.drumsGainNode.gain.value = 0;
          }
          kickGain.connect(this.drumsGainNode);

          kick.type = 'sine';
          kick.frequency.setValueAtTime(80, time);
          kick.frequency.exponentialRampToValueAtTime(40, time + 0.1);

          kickGain.gain.setValueAtTime(this.masterVolume * 0.6, time);
          kickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

          kick.start(time);
          kick.stop(time + 0.15);
        } else if (drum.type === 'snare') {
          // Snare - sharp crack
          const snare = this.audioContext.createOscillator();
          const snareGain = this.audioContext.createGain();

          snare.connect(snareGain);

          if (!this.drumsGainNode) {
            this.drumsGainNode = this.audioContext.createGain();
            this.drumsGainNode.connect(this.audioContext.destination);
            this.drumsGainNode.gain.value = 0;
          }
          snareGain.connect(this.drumsGainNode);

          snare.type = 'triangle';
          snare.frequency.setValueAtTime(200, time);

          snareGain.gain.setValueAtTime(this.masterVolume * 0.4, time);
          snareGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

          snare.start(time);
          snare.stop(time + 0.1);
        } else if (drum.type === 'hihat') {
          // Hi-hat - bright crisp metallic sound
          const hihat = this.audioContext.createOscillator();
          const hihatGain = this.audioContext.createGain();

          hihat.connect(hihatGain);

          if (!this.drumsGainNode) {
            this.drumsGainNode = this.audioContext.createGain();
            this.drumsGainNode.connect(this.audioContext.destination);
            this.drumsGainNode.gain.value = 0;
          }
          hihatGain.connect(this.drumsGainNode);

          // High frequency square wave for metallic sound
          hihat.type = 'square';
          hihat.frequency.setValueAtTime(8000, time);

          hihatGain.gain.setValueAtTime(this.masterVolume * 0.15, time);
          hihatGain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

          hihat.start(time);
          hihat.stop(time + 0.05);
        }
      }
    };

    // Initialize drums gain node at start
    if (!this.drumsGainNode) {
      this.drumsGainNode = this.audioContext.createGain();
      this.drumsGainNode.connect(this.audioContext.destination);
      this.drumsGainNode.gain.value = 0; // Start silent
    }

    const loopMusic = () => {
      if (!this.musicPlaying) return;

      schedulePart(bass, 'sine', 0.9);
      schedulePart(chords, 'square', 0.35);
      schedulePart(countermel, 'triangle', 0.5);
      schedulePart(melody, 'sawtooth', 0.55);
      scheduleDrums();

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
    this.drumsEnabled = false;
    if (this.drumsGainNode) {
      this.drumsGainNode.gain.setTargetAtTime(0, this.audioContext.currentTime, 0.5);
    }
  }

  // Update music intensity based on enemy count
  public updateMusicIntensity(enemyCount: number): void {
    if (!this.musicPlaying || this.bossMusic) return;

    const shouldHaveDrums = enemyCount > 6;

    if (shouldHaveDrums && !this.drumsEnabled) {
      // Fade in drums
      this.drumsEnabled = true;
      if (this.drumsGainNode) {
        this.drumsGainNode.gain.setTargetAtTime(1, this.audioContext.currentTime, 0.5);
      }
    } else if (!shouldHaveDrums && this.drumsEnabled) {
      // Fade out drums
      this.drumsEnabled = false;
      if (this.drumsGainNode) {
        this.drumsGainNode.gain.setTargetAtTime(0, this.audioContext.currentTime, 0.5);
      }
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
    // Start on a somewhat random note within a low range
    const randomNotes = [55, 58.27, 61.74, 65.41, 69.30, 73.42]; // A1, A#1, B1, C2, C#2, D2
    this.shepardBaseFreq = randomNotes[Math.floor(Math.random() * randomNotes.length)];
    const numOctaves = 8; // More octaves for smoother overlap

    for (let i = 0; i < numOctaves; i++) {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.connect(gain);
      gain.connect(this.audioContext.destination);

      osc.type = 'sine';
      const freq = this.shepardBaseFreq * Math.pow(2, i);
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
    const riseDuration = 10; // Slower rise for more overlap
    const baseFreq = this.shepardBaseFreq;
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

      // Wider bell curve for more overlapping audible tones
      const peakPos = 0.5; // Peak at middle
      const bellWidth = 0.6; // Wider for more overlap
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

      bassGain.gain.setValueAtTime(this.masterVolume * 0.45, time); // Increased from 0.25 to 0.45
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
