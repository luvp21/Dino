// =============================================
// SKIN CONFIGURATION - HYBRID ARCHITECTURE
// =============================================
// Filter-Based Skins: Use CSS filters on classic sprite sheet
// Sprite-Based Skins: Use custom sprite sheets (future premium skins)
// =============================================

import type { SkinType } from '@/types/game';
import { CLASSIC_SPRITE_DEFINITION, CLASSIC_SPRITE_DEFINITION_LDPI, type SpriteDefinition } from './SpriteDefinitions';

export type SkinRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface SkinConfig {
  // Required: sprite sheet and definitions
  spriteSheet: string;
  definition: SpriteDefinition;
  definitionHDPI: SpriteDefinition;
  
  // Rarity tier for shop pricing
  rarity: SkinRarity;
  
  // Optional: CSS filter for color-based skins
  filter?: string;
  
  // Optional: custom background/ground colors
  backgroundColor?: string;
  groundColor?: string;
}

// =============================================
// FILTER-BASED SKINS
// All use classic sprite sheet with CSS filters
// =============================================

const CLASSIC_BASE = {
  spriteSheet: '/offline-sprite.png',
  definition: CLASSIC_SPRITE_DEFINITION_LDPI,
  definitionHDPI: CLASSIC_SPRITE_DEFINITION,
};

export const SKIN_CONFIGS: Record<SkinType, SkinConfig> = {
  // === COMMON (Free) ===
  classic: {
    ...CLASSIC_BASE,
    rarity: 'common',
  },
  
  // === RARE ===
  inverted: {
    ...CLASSIC_BASE,
    rarity: 'rare',
    filter: 'invert(1)',
    backgroundColor: '#1A1A1A',
  },
  
  phosphor: {
    ...CLASSIC_BASE,
    rarity: 'rare',
    filter: 'sepia(1) saturate(10) hue-rotate(90deg)',
    backgroundColor: '#001A00',
    groundColor: '#004400',
  },
  
  amber: {
    ...CLASSIC_BASE,
    rarity: 'rare',
    filter: 'sepia(1) saturate(5) hue-rotate(15deg)',
    backgroundColor: '#1A0D00',
    groundColor: '#4D2600',
  },
  
  // === EPIC ===
  crt: {
    ...CLASSIC_BASE,
    rarity: 'epic',
    filter: 'contrast(1.1) brightness(0.9)',
    backgroundColor: '#141414',
  },
  
  winter: {
    ...CLASSIC_BASE,
    rarity: 'epic',
    filter: 'saturate(0.7) brightness(1.1) hue-rotate(190deg)',
    backgroundColor: '#1a2a3a',
    groundColor: '#4a6a8a',
  },
  
  neon: {
    ...CLASSIC_BASE,
    rarity: 'epic',
    filter: 'sepia(1) saturate(10) hue-rotate(270deg)',
    backgroundColor: '#0D0D0D',
  },
  
  // === LEGENDARY ===
  golden: {
    ...CLASSIC_BASE,
    rarity: 'legendary',
    filter: 'sepia(1) saturate(3) hue-rotate(15deg) brightness(1.2)',
    backgroundColor: '#1A1500',
    groundColor: '#3D3200',
  },
};

/**
 * Get the skin config for a given skin type
 */
export function getSkinConfig(skin: SkinType): SkinConfig {
  return SKIN_CONFIGS[skin] || SKIN_CONFIGS.classic;
}

/**
 * Get the appropriate sprite definition based on device pixel ratio
 */
export function getSpriteDefinition(skin: SkinType, isHDPI: boolean = false): SpriteDefinition {
  const config = getSkinConfig(skin);
  return isHDPI ? config.definitionHDPI : config.definition;
}

/**
 * Get rarity color for UI display
 */
export function getRarityColor(rarity: SkinRarity): string {
  switch (rarity) {
    case 'common': return '#9CA3AF';    // Gray
    case 'rare': return '#3B82F6';      // Blue
    case 'epic': return '#A855F7';      // Purple
    case 'legendary': return '#F59E0B'; // Gold/Amber
  }
}

/**
 * Get rarity display name
 */
export function getRarityName(rarity: SkinRarity): string {
  return rarity.toUpperCase();
}
