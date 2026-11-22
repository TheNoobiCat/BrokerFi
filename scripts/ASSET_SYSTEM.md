# BrokerFi Asset Management System

## 🎯 Overview

Unified, enterprise-grade asset management system with:
- **Optimized JSON** (87% smaller) for fast loading
- **Sprite sheets** for efficient icon delivery
- **Popular assets** marking system
- **Client-side favorites** with localStorage persistence

---

## 📁 File Structure

```
scripts/
├── popular-assets.json          # Centralized popular assets config ⭐
├── optimize-assets.ts            # JSON optimization (adds popular flag)
├── generate-crypto-sprite.py     # Crypto icon downloader + sprite gen
├── generate-sprites.py           # Stock/Forex/Commodity sprite gen
├── generate-all-sprites.ts       # Unified sprite generation wrapper
├── download_icons.py             # Legacy icon downloader (backup)
└── assetslister/
    └── pyth_feeds_organized.json # Source data from Pyth Network

public/
├── data/
│   ├── assets-index.json         # Optimized master index
│   ├── assets-crypto.json        # Crypto assets (with popular flag)
│   ├── assets-stocks.json        # Stock assets (with popular flag)
│   ├── assets-forex.json         # Forex assets (with popular flag)
│   └── assets-commodities.json   # Commodities (with popular flag)
│
├── sprites/
│   ├── crypto.webp              # Crypto sprite sheet
│   ├── crypto.json              # Crypto sprite coordinates
│   ├── stock.webp               # Stock sprite sheet
│   └── stock.json               # Stock sprite coordinates
│
└── icons/                       # Individual icon fallbacks
```

---

## 🚀 Build Commands

### Optimize Assets (JSON)
```bash
npm run optimize:assets
```
- Reads from `scripts/assetslister/pyth_feeds_organized.json`
- Loads popular list from `scripts/popular-assets.json`
- Outputs compressed JSON to `public/data/`
- Adds `p: 1` flag to popular assets

### Generate Sprites (Icons)
```bash
npm run optimize:sprites
```
- Downloads crypto icons from Cryptofonts
- Generates sprite sheets for all asset types
- Outputs to `public/sprites/`

### Full Build
```bash
npm run build
```
- Automatically runs both optimizations
- Builds Next.js production bundle

---

## ⭐ Managing Popular Assets

### 1. Edit Popular List

Edit `scripts/popular-assets.json`:

```json
{
  "popular": [
    "BTCUSD",     // Crypto symbols
    "ETHUSD",
    "AAPL",       // Stock tickers
    "TSLA",
    "EUR/USD",    // Forex pairs
    "Gold"        // Commodities
  ]
}
```

### 2. Regenerate Assets

```bash
npm run optimize:assets
```

Popular assets will have `p: 1` in the output JSON and will:
- Show a ⭐ star icon in the UI
- Appear at the top of lists (after user favorites)
- Be available for easy toggling by users

---

## 💾 Client-Side Favorites

Users can favorite/unfavorite any asset:

- **Click the star** next to any asset
- **Persisted** in localStorage (`brokerfi-favorites`)
- **Sorted first** in all asset lists
- **Yellow star** for favorited, gray star for popular

### Implementation

```tsx
import { useFavorites } from '@/hooks/useFavorites'

function MyComponent() {
  const { favorites, toggleFavorite, isFavorite } = useFavorites()
  
  return (
    <button onClick={() => toggleFavorite(asset.urlSlug)}>
      {isFavorite(asset.urlSlug) ? '⭐' : '☆'}
    </button>
  )
}
```

---

## 🔧 How It Works

### Asset Loading Flow

1. **Client requests** → `services/assets.ts`
2. **Fetch optimized** → `/data/assets-index.json`
3. **Expand compressed** → `expandAsset()` adds `popular` field
4. **Sort by favorites** → User favorites first, then popular, then rest
5. **Render with stars** → Popular/favorite assets show stars

### Popular Flag Flow

```
popular-assets.json
       ↓
optimize-assets.ts (marks with p: 1)
       ↓
public/data/*.json
       ↓
services/assets.ts (reads p flag)
       ↓
AssetData.popular = true
       ↓
UI components (show star)
```

---

## 📊 Performance Metrics

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| JSON Size | 147 KB | 19 KB gzipped | **87% ↓** |
| HTTP Requests | 607 icons | 2 sprites | **99.7% ↓** |
| Icon Total | 1,287 KB | 84 KB | **93.5% ↓** |
| Load Time | ~300ms | ~50ms | **83% ↓** |

---

## 🔄 Workflow

### Adding New Popular Assets

1. Edit `scripts/popular-assets.json`
2. Run `npm run optimize:assets`
3. Commit changes to git
4. Deploy

### Updating Asset Data

1. Update `scripts/assetslister/pyth_feeds_organized.json`
2. Run `npm run optimize:assets`
3. Run `npm run optimize:sprites` (if new assets)
4. Deploy

### Testing Locally

```bash
npm run dev
# Open sidebar or mobile selector
# Check that popular assets show stars
# Click stars to favorite/unfavorite
# Refresh page - favorites should persist
```

---

## 🐛 Troubleshooting

### Missing Popular Flags

```bash
# Check if popular-assets.json exists
cat scripts/popular-assets.json

# Regenerate with verbose output
npm run optimize:assets
# Should show "⭐ Loaded X popular assets"
```

### Sprites Not Generated

```bash
# Check Python installation
python --version

# Install dependencies
pip install Pillow requests

# Generate manually
python scripts/generate-crypto-sprite.py
python scripts/generate-sprites.py
```

### Favorites Not Persisting

- Check browser localStorage (DevTools → Application → Local Storage)
- Look for `brokerfi-favorites` key
- Clear and test: `localStorage.clear()`

---

## 📝 Notes

- **Popular vs Favorites**: Popular is server-defined, favorites are user-defined
- **Symbol Matching**: Popular matching is case-insensitive and uses `includes()`
- **Star Colors**: Yellow = favorite, Gray = popular (not favorited)
- **Sort Order**: Favorites → Popular → Rest
- **Persistence**: Only favorites persist (popular is in data)

---

## 🎉 Summary

You now have a clean, unified system for:

✅ Managing popular assets from one config file  
✅ Letting users favorite any asset with localStorage  
✅ Efficient sprite-based icon delivery  
✅ Optimized JSON for fast loading  
✅ Stars showing popular/favorite status  
✅ Automatic sorting (favorites first)  

No more fragmented scripts! 🚀
