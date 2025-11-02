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
    spawnWeight: 0.15, // 15% chance
    movePattern: 'sine',
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
    let weight = config.spawnWeight;

    // Harder enemies become more common as waves progress
    if (type === 'fast' || type === 'weaver' || type === 'spinner' || type === 'dasher') {
      weight *= (1 + waveMultiplier * 0.5);
    }
    if (type === 'tank') {
      weight *= (1 + waveMultiplier * 0.3);
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
