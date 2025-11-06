import { type EnemyType } from '../entities/Enemy';

export type MovePattern = 'straight' | 'zigzag' | 'sine' | 'circular' | 'diagonal';

export interface EnemyTypeConfig {
  speed: number;
  speedVariation: number; // +/- random variation
  health: number;
  points: number;
  color: number;
  secondaryColor?: number;
  tertiaryColor?: number;
  size: {
    width: number;
    height: number;
  };
  spawnWeight: number; // Relative probability of spawning (0-1)
  movePattern: MovePattern;
  heatEmission: number; // Heat signature for missile targeting (0-1, higher = more attractive)
  isBoss?: boolean; // Whether this is a boss enemy
  shootInterval?: number; // How often boss shoots (ms), undefined = doesn't shoot
  shootPattern?: 'single' | 'triple' | 'spread' | 'aimed'; // Shooting pattern for bosses
  maxY?: number; // Maximum Y position (for bosses that shouldn't go below a certain point)
}

export interface EnemyConfig {
  [key: string]: EnemyTypeConfig;
}

export const ENEMY_CONFIG: EnemyConfig = {
  basic: {
    speed: 1.5,
    speedVariation: 0.2,
    health: 1,
    points: 10,
    color: 0xff4444,
    secondaryColor: 0x000000,
    size: {
      width: 40,
      height: 30,
    },
    spawnWeight: 0.35, // 35% chance
    movePattern: 'straight',
    heatEmission: 0.3, // Low heat
  },
  fast: {
    speed: 3.5,
    speedVariation: 0.3,
    health: 1,
    points: 15,
    color: 0x00ffff,
    secondaryColor: 0xffffff,
    size: {
      width: 30,
      height: 30,
    },
    spawnWeight: 0.15, // 15% chance
    movePattern: 'zigzag',
    heatEmission: 0.8, // High heat - fast movement generates more heat
  },
  tank: {
    speed: 0.8,
    speedVariation: 0.1,
    health: 3,
    points: 30,
    color: 0x8b008b,
    secondaryColor: 0x696969,
    size: {
      width: 60,
      height: 40,
    },
    spawnWeight: 0.15, // 15% chance
    movePattern: 'straight',
    heatEmission: 1.0, // Maximum heat - large and heavily armored
  },
  weaver: {
    speed: 2.0,
    speedVariation: 0.2,
    health: 2,
    points: 20,
    color: 0xffaa00,
    secondaryColor: 0xffff00,
    size: {
      width: 35,
      height: 35,
    },
    spawnWeight: 0.08, // 8% chance (reduced from 15%)
    movePattern: 'sine',
    heatEmission: 0.6, // Medium-high heat
  },
  spinner: {
    speed: 1.8,
    speedVariation: 0.2,
    health: 2,
    points: 25,
    color: 0xff00ff,
    secondaryColor: 0x00ffff,
    tertiaryColor: 0xffff00,
    size: {
      width: 40,
      height: 40,
    },
    spawnWeight: 0.1, // 10% chance
    movePattern: 'circular',
    heatEmission: 0.9, // Very high heat - spinning generates heat
  },
  dasher: {
    speed: 2.5,
    speedVariation: 0.3,
    health: 1,
    points: 18,
    color: 0x00ff00,
    secondaryColor: 0xffffff,
    size: {
      width: 35,
      height: 25,
    },
    spawnWeight: 0.1, // 10% chance
    movePattern: 'diagonal',
    heatEmission: 0.7, // High heat - fast diagonal movement
  },
  stealth: {
    speed: 1.2,
    speedVariation: 0.2,
    health: 4,
    points: 50, // High points for rare, challenging enemy
    color: 0x1a1a2e, // Almost background color when cloaked
    secondaryColor: 0x00ffaa, // Glow color when uncloaked
    tertiaryColor: 0x00ff88, // Bright glow
    size: {
      width: 45,
      height: 35,
    },
    spawnWeight: 0.05, // 5% chance - rare!
    movePattern: 'zigzag', // Erratic movement
    heatEmission: 0.1, // Very low heat - stealth tech keeps signature low
    shootInterval: 3000, // Shoots every 3 seconds
    shootPattern: 'aimed', // Precise aimed shots
  },
  kamikaze: {
    speed: 4.0,
    speedVariation: 0.5,
    health: 1,
    points: 40, // High points for risk/reward
    color: 0xff5555,
    secondaryColor: 0xff0000,
    size: {
      width: 30,
      height: 30,
    },
    spawnWeight: 0.15, // 15% chance - increased from 12%
    movePattern: 'straight', // Direct approach
    heatEmission: 0.9, // High heat - aggressive engines
    // No shootInterval or shootPattern - kamikaze crashes into player
  },
  phantom: {
    speed: 1.0,
    speedVariation: 0.3,
    health: 3,
    points: 60, // Very high points for very rare enemy
    color: 0x9370db, // Medium purple (base form)
    secondaryColor: 0x7b68ee, // Medium slate blue (shimmer)
    tertiaryColor: 0xba55d3, // Medium orchid (glow)
    size: {
      width: 42,
      height: 38,
    },
    spawnWeight: 0.12, // 12% chance - increased from 8%
    movePattern: 'sine', // Smooth ghostly movement
    heatEmission: 0.2, // Very low heat - phase-shifted, hard to lock on
    shootInterval: 2500, // Shoots every 2.5 seconds
    shootPattern: 'triple', // Fires spread pattern
  },
  boss: {
    speed: 1.5, // Increased from 1.0 - faster movement
    speedVariation: 0.0, // No variation for bosses
    health: 100, // Increased from 50 - much tankier
    points: 1000, // Increased from 500 - bigger reward for harder fight
    color: 0xff0000,
    secondaryColor: 0xff6600,
    tertiaryColor: 0xffaa00,
    size: {
      width: 120, // Much larger
      height: 100,
    },
    spawnWeight: 0, // Never spawned randomly, only on boss waves
    movePattern: 'sine', // Smooth side-to-side movement
    heatEmission: 1.0, // Maximum heat signature
    isBoss: true,
    shootInterval: 1500, // Shoots every 1.5 seconds
    shootPattern: 'triple', // Fires 3 bullets in a spread
    maxY: 250, // Stays in upper third of screen
  },
  bossSniper: {
    speed: 1.0, // Slower, more methodical
    speedVariation: 0.0,
    health: 80, // Less health than standard boss
    points: 1200, // Higher points for harder to dodge attacks
    color: 0x9400d3, // Purple
    secondaryColor: 0x8a2be2,
    tertiaryColor: 0xff00ff,
    size: {
      width: 100,
      height: 90,
    },
    spawnWeight: 0,
    movePattern: 'circular', // Orbits around while shooting
    heatEmission: 1.0,
    isBoss: true,
    shootInterval: 800, // Shoots every 0.8 seconds - much faster fire rate
    shootPattern: 'aimed', // Precise aimed shots at player
    maxY: 200, // Stays higher up
  },
  bossTank: {
    speed: 0.8, // Very slow
    speedVariation: 0.0,
    health: 150, // Much tankier
    points: 1500, // Highest points for longest fight
    color: 0x4b0082, // Indigo/dark purple
    secondaryColor: 0x483d8b,
    tertiaryColor: 0x696969,
    size: {
      width: 140, // Largest boss
      height: 120,
    },
    spawnWeight: 0,
    movePattern: 'straight', // Just moves down slowly
    heatEmission: 1.0,
    isBoss: true,
    shootInterval: 1000, // Shoots frequently
    shootPattern: 'spread', // Wide spread of bullets
    maxY: 300, // Can come down a bit lower due to being slow
  },
  bossSwarm: {
    speed: 2.0, // Fast and aggressive
    speedVariation: 0.0,
    health: 60, // Lower health, relies on speed
    points: 1100,
    color: 0x00ced1, // Cyan
    secondaryColor: 0x00ffff,
    tertiaryColor: 0x1e90ff,
    size: {
      width: 90,
      height: 80,
    },
    spawnWeight: 0,
    movePattern: 'zigzag', // Erratic movement
    heatEmission: 1.0,
    isBoss: true,
    shootInterval: 800, // Shoots very frequently
    shootPattern: 'single', // Single shots but rapid fire
    maxY: 280,
  },
  bossTriple: {
    speed: 1.2, // Medium speed
    speedVariation: 0.0,
    health: 90, // Distributed across three ships (30 each)
    points: 1300,
    color: 0xff4500, // Orange-red
    secondaryColor: 0xffa500, // Orange
    tertiaryColor: 0xffd700, // Gold
    size: {
      width: 110, // Total formation width
      height: 85,
    },
    spawnWeight: 0,
    movePattern: 'sine', // Formation moves in wave pattern
    heatEmission: 1.0,
    isBoss: true,
    shootInterval: 1200, // All three ships shoot
    shootPattern: 'triple', // Each ship fires
    maxY: 260,
  },
};

// Helper function to select a random enemy type based on spawn weights
// Optional wave parameter to increase difficulty of enemy types over time
export function selectRandomEnemyType(wave: number = 1): EnemyType {
  // As waves progress, shift probabilities toward harder enemies
  const waveMultiplier = Math.min(wave / 10, 1.5); // Cap at 1.5x

  // Calculate adjusted weights
  const adjustedWeights: { [key: string]: number } = {};
  let totalWeight = 0;

  for (const [type, config] of Object.entries(ENEMY_CONFIG)) {
    // Skip bosses (they have spawnWeight 0)
    if (config.spawnWeight === 0) continue;

    let weight = config.spawnWeight;

    // Harder enemies become more common as waves progress
    if (type === 'fast' || type === 'weaver' || type === 'spinner' || type === 'dasher') {
      weight *= (1 + waveMultiplier * 0.5);
    }
    if (type === 'tank') {
      weight *= (1 + waveMultiplier * 0.3);
    }
    // Rare enemies become more common in later waves
    if (type === 'phantom' || type === 'stealth' || type === 'kamikaze') {
      weight *= (1 + waveMultiplier * 0.8); // Boost rare enemies significantly
    }
    // Basic enemies become less common
    if (type === 'basic') {
      weight *= Math.max(0.3, 1 - waveMultiplier * 0.3);
    }

    adjustedWeights[type] = weight;
    totalWeight += weight;
  }

  // Normalize weights
  for (const type in adjustedWeights) {
    adjustedWeights[type] /= totalWeight;
  }

  // Select enemy based on adjusted weights
  const rand = Math.random();
  let cumulative = 0;

  for (const [type, weight] of Object.entries(adjustedWeights)) {
    cumulative += weight;
    if (rand < cumulative) {
      return type as EnemyType;
    }
  }

  // Fallback to basic if something goes wrong
  return 'basic';
}

// Helper function to get enemy configuration
export function getEnemyConfig(type: EnemyType): EnemyTypeConfig {
  return ENEMY_CONFIG[type];
}

// Helper function to select a random boss type
export function selectRandomBossType(wave: number = 1): EnemyType {
  const bossTypes: EnemyType[] = ['boss', 'bossSniper', 'bossTank', 'bossSwarm', 'bossTriple'];

  // For first boss wave, always use standard boss
  if (wave <= 3) {
    return 'boss';
  }

  // For subsequent waves, randomly select from all boss types
  return bossTypes[Math.floor(Math.random() * bossTypes.length)];
}
