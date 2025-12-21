import type { SkinType } from '@/types/game';
import { CLASSIC_SPRITE_DEFINITION, CLASSIC_SPRITE_DEFINITION_LDPI, type SpriteDefinition } from './SpriteDefinitions';

export type SkinRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface SkinConfig {
  spriteSheet?: string;
  spriteSheetHDPI?: string;
  definition: SpriteDefinition;
  definitionHDPI: SpriteDefinition;

  rarity: SkinRarity;

  filter?: string;

  backgroundColor?: string;
  groundColor?: string;

  // Optional preview image path (relative to /public folder)
  // If provided, this image will be used in the shop instead of rendering the canvas
  previewImage?: string;
}

const CLASSIC_BASE = {
  spriteSheet: '/200-offline-sprite.png',
  spriteSheetHDPI: '/200-offline-sprite.png',
  definition: CLASSIC_SPRITE_DEFINITION_LDPI,
  definitionHDPI: CLASSIC_SPRITE_DEFINITION,
};

// common, rare, epic, legendary
// common: free
// rare: 100 coins
// epic: 200 coins
// legendary: 500 coins

export const SKIN_CONFIGS: Partial<Record<string, SkinConfig>> = {
  classic: {
    ...CLASSIC_BASE,
    rarity: 'common',
    previewImage: 'prv/classic-prv.png',
  },

  blue: {
    ...CLASSIC_BASE,
    spriteSheet: '/blue.png',
    rarity: 'common',
    previewImage: '/prv/blue-prv.png',
  },

  red: {
    ...CLASSIC_BASE,
    spriteSheet: '/red.png',
    rarity: 'common',
    previewImage: '/prv/red-prv.png',
  },

  green: {
    ...CLASSIC_BASE,
    spriteSheet: '/green.png',
    rarity: 'common',
    previewImage: '/prv/green-prv.png',
  },

  golden: {
    ...CLASSIC_BASE,
    spriteSheet: '/golden.png',
    rarity: 'common',
    previewImage: '/prv/golden-prv.png',
  },

  purple: {
    ...CLASSIC_BASE,
    spriteSheet: '/purple.png',
    rarity: 'common',
    previewImage: '/prv/purple-prv.png',
  },

};


export function getSkinConfig(skin: SkinType): SkinConfig {
  return SKIN_CONFIGS[skin] || SKIN_CONFIGS.classic || {
    ...CLASSIC_BASE,
    rarity: 'common' as SkinRarity,
  };
}

export function getSpriteDefinition(skin: SkinType, isHDPI: boolean = false): SpriteDefinition {
  const config = getSkinConfig(skin);
  return isHDPI ? config.definitionHDPI : config.definition;
}

