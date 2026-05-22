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

  // Retro Green Phosphor terminal skin
  phosphor: {
    ...CLASSIC_BASE,
    rarity: 'rare',
    filter: 'brightness(1.1) sepia(1) saturate(10) hue-rotate(85deg)',
    backgroundColor: '#031405',
    groundColor: '#00ff00',
    previewImage: '/prv/phosphor-prv.png',
  },

  // Vintage Amber terminal skin
  amber: {
    ...CLASSIC_BASE,
    rarity: 'rare',
    filter: 'brightness(1.1) sepia(1) saturate(8) hue-rotate(15deg)',
    backgroundColor: '#140d02',
    groundColor: '#ffb000',
    previewImage: '/prv/amber-prv.png',
  },

  // Dark Mode / Inverted dino
  inverted: {
    ...CLASSIC_BASE,
    rarity: 'common',
    filter: 'invert(1) hue-rotate(180deg)',
    backgroundColor: '#151515',
    groundColor: '#ebebeb',
    previewImage: '/prv/inverted-prv.png',
  },

  // Scanline CRT Monitor effect
  crt: {
    ...CLASSIC_BASE,
    rarity: 'rare',
    filter: 'contrast(1.15) brightness(0.85) sepia(0.05)',
    backgroundColor: '#0f1012',
    groundColor: '#a0a0a0',
    previewImage: '/prv/crt-prv.png',
  },

  // Winter Ice Theme
  winter: {
    ...CLASSIC_BASE,
    rarity: 'epic',
    filter: 'hue-rotate(190deg) brightness(1.2) saturate(1.5)',
    backgroundColor: '#e6f3ff',
    groundColor: '#80c0ff',
    previewImage: '/prv/winter-prv.png',
  },

  // Neon Vaporwave Theme
  neon: {
    ...CLASSIC_BASE,
    rarity: 'epic',
    filter: 'hue-rotate(290deg) saturate(2) brightness(1.1)',
    backgroundColor: '#1a052e',
    groundColor: '#ff007f',
    previewImage: '/prv/neon-prv.png',
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

