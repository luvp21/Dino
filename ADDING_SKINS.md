# Adding New Skins - Quick Guide

Adding a new skin is now much easier! You only need to:

## 1. Add the skin to the database

Insert a new row into the `skins` table:

```sql
INSERT INTO public.skins (name, skin_key, description, price, is_premium, rarity)
VALUES ('My New Skin', 'my-new-skin', 'A cool new skin', 150, true, 'rare');
```

**Important fields:**
- `skin_key`: The unique identifier (used in code) - use lowercase with hyphens
- `name`: Display name
- `description`: What shows in the shop
- `price`: Cost in coins (0 for free skins)
- `rarity`: 'common', 'rare', 'epic', or 'legendary'
- `is_premium`: true for paid skins
- `is_seasonal`: true for limited-time skins (optional)

## 2. (Optional) Add visual config in SkinConfig.ts

If your skin needs custom sprites, filters, or colors, add it to `SKIN_CONFIGS`:

```typescript
export const SKIN_CONFIGS: Partial<Record<string, SkinConfig>> = {
  // ... existing skins ...

  'my-new-skin': {
    ...CLASSIC_BASE,
    rarity: 'rare',
    filter: 'sepia(1) saturate(5)', // Optional CSS filter
    backgroundColor: '#1A1A1A', // Optional background color
    groundColor: '#2A2A2A', // Optional ground color
  },
};
```

**If you don't add a config:**
- The skin will automatically fall back to the 'classic' skin appearance
- It will still work in the shop and can be purchased/equipped
- You can add the config later when you have the assets ready

## 3. (Optional) Add a symbol for leaderboard

If you want a custom symbol in the leaderboard, add it to `SKIN_SYMBOLS` in `LeaderboardPage.tsx`:

```typescript
const SKIN_SYMBOLS: Record<string, string> = {
  // ... existing symbols ...
  'my-new-skin': '◆',
};
```

If you don't add one, it will default to '■' (classic symbol).

## That's it!

The skin will now:
- ✅ Appear in the shop automatically
- ✅ Be purchasable (if price > 0)
- ✅ Be equippable once owned
- ✅ Work in-game (falls back to classic if no config)
- ✅ Show in leaderboards
- ✅ Work for both guests and authenticated users

## Notes

- **No TypeScript changes needed**: `SkinType` is now `string`, so any skin key works
- **No database constraint**: The old CHECK constraint has been removed
- **Graceful fallbacks**: Unknown skins automatically use 'classic' appearance
- **Database is source of truth**: The shop pulls directly from the `skins` table

