// Skin configuration mapping skins to sprite sheets and definitions

import type { SkinType } from '@/types/game';
import { CLASSIC_SPRITE_DEFINITION, CLASSIC_SPRITE_DEFINITION_LDPI, type SpriteDefinition } from './SpriteDefinitions';

export interface SkinConfig {
  spriteSheet: string;
  spriteSheetHDPI?: string;
  definition: SpriteDefinition;
  definitionHDPI: SpriteDefinition;
  // Optional color filters/tints
  filter?: string;
  // Background color override
  backgroundColor?: string;
  // Ground color override  
  groundColor?: string;
}

// All skins use the classic sprite sheet for now
// Future skins can have their own sprite sheets
export const SKIN_CONFIGS: Record<SkinType, SkinConfig> = {
  classic: {
    spriteSheet: '/offline-sprite.png',
    definition: CLASSIC_SPRITE_DEFINITION_LDPI,
    definitionHDPI: CLASSIC_SPRITE_DEFINITION,
  },
  inverted: {
    spriteSheet: '/offline-sprite.png',
    definition: CLASSIC_SPRITE_DEFINITION_LDPI,
    definitionHDPI: CLASSIC_SPRITE_DEFINITION,
    filter: 'invert(1)',
    backgroundColor: '#1A1A1A',
  },
  phosphor: {
    spriteSheet: '/offline-sprite.png',
    definition: CLASSIC_SPRITE_DEFINITION_LDPI,
    definitionHDPI: CLASSIC_SPRITE_DEFINITION,
    filter: 'sepia(1) saturate(10) hue-rotate(90deg)',
    backgroundColor: '#001A00',
    groundColor: '#004400',
  },
  amber: {
    spriteSheet: '/offline-sprite.png',
    definition: CLASSIC_SPRITE_DEFINITION_LDPI,
    definitionHDPI: CLASSIC_SPRITE_DEFINITION,
    filter: 'sepia(1) saturate(5) hue-rotate(15deg)',
    backgroundColor: '#1A0D00',
    groundColor: '#4D2600',
  },
  crt: {
    spriteSheet: '/offline-sprite.png',
    definition: CLASSIC_SPRITE_DEFINITION_LDPI,
    definitionHDPI: CLASSIC_SPRITE_DEFINITION,
    filter: 'contrast(1.1) brightness(0.9)',
    backgroundColor: '#141414',
  },
  winter: {
    spriteSheet: '/offline-sprite.png',
    definition: CLASSIC_SPRITE_DEFINITION_LDPI,
    definitionHDPI: CLASSIC_SPRITE_DEFINITION,
    filter: 'saturate(0.7) brightness(1.1) hue-rotate(190deg)',
    backgroundColor: '#1a2a3a', // Dark blue-gray sky
    groundColor: '#4a6a8a', // Icy blue ground
  },
  neon: {
    spriteSheet: '/offline-sprite.png',
    definition: CLASSIC_SPRITE_DEFINITION_LDPI,
    definitionHDPI: CLASSIC_SPRITE_DEFINITION,
    filter: 'sepia(1) saturate(10) hue-rotate(270deg)',
    backgroundColor: '#0D0D0D',
  },
  golden: {
    spriteSheet: '/offline-sprite.png',
    definition: CLASSIC_SPRITE_DEFINITION_LDPI,
    definitionHDPI: CLASSIC_SPRITE_DEFINITION,
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
