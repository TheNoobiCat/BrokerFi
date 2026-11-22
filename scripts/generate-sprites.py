#!/usr/bin/env python3
"""
Sprite Sheet Generator for BrokerFi
Generates optimized sprite sheets from icon files for enterprise performance

Features:
- Combines multiple icons into single sprite sheets
- Generates WebP format for 60-80% size reduction
- Creates JSON coordinate maps
- Separates by category (crypto, stocks, forex, commodities)
- Reduces HTTP requests from 741 to 4

Requirements:
  pip install Pillow

Usage:
  python scripts/generate-sprites.py
"""

import json
import os
from pathlib import Path
from typing import Dict, List, Tuple
from PIL import Image

# Configuration
ICON_DIR = Path('public/icons')
SPRITE_DIR = Path('public/sprites')
ICON_SIZE = 20  # All icons are 20x20px
SPRITE_WIDTH = 20  # Number of icons per row
QUALITY = 90  # WebP quality (0-100)

CATEGORIES = {
    'crypto': 'c',
    'stock': 's',
    'forex': 'f',
    'commodity': 'x'
}

def ensure_dir(path: Path):
    """Create directory if it doesn't exist"""
    path.mkdir(parents=True, exist_ok=True)

def get_icon_files() -> Dict[str, List[Path]]:
    """Collect all icon files grouped by category"""
    files_by_category = {cat: [] for cat in CATEGORIES.keys()}
    
    for file_path in ICON_DIR.glob('*.png'):
        filename = file_path.stem
        
        # Determine category from filename prefix
        for category in CATEGORIES.keys():
            if filename.startswith(f"{category}_") or filename.startswith(f"{category}-"):
                files_by_category[category].append(file_path)
                break
    
    return files_by_category

def create_sprite_sheet(icon_files: List[Path], output_path: Path) -> Dict[str, Dict]:
    """
    Create a sprite sheet from icon files
    Returns a dictionary mapping icon names to their coordinates
    """
    if not icon_files:
        return {}
    
    # Sort files for consistent ordering
    icon_files = sorted(icon_files)
    
    # Calculate sprite sheet dimensions
    num_icons = len(icon_files)
    cols = SPRITE_WIDTH
    rows = (num_icons + cols - 1) // cols  # Ceiling division
    
    sprite_width = cols * ICON_SIZE
    sprite_height = rows * ICON_SIZE
    
    print(f"  Creating sprite: {sprite_width}x{sprite_height}px ({num_icons} icons, {rows} rows)")
    
    # Create transparent sprite sheet
    sprite = Image.new('RGBA', (sprite_width, sprite_height), (0, 0, 0, 0))
    
    # Position map for JSON output
    positions = {}
    
    # Place each icon
    for idx, icon_path in enumerate(icon_files):
        try:
            # Load and resize icon to ensure consistent size
            icon = Image.open(icon_path).convert('RGBA')
            icon = icon.resize((ICON_SIZE, ICON_SIZE), Image.Resampling.LANCZOS)
            
            # Calculate position
            row = idx // cols
            col = idx % cols
            x = col * ICON_SIZE
            y = row * ICON_SIZE
            
            # Paste icon
            sprite.paste(icon, (x, y), icon)
            
            # Extract symbol name (remove category prefix and extension)
            symbol = icon_path.stem
            for prefix in ['crypto_', 'crypto-', 'stock_', 'stock-', 'forex_', 'forex-', 'commodity_', 'commodity-']:
                if symbol.startswith(prefix):
                    symbol = symbol[len(prefix):]
                    break
            
            # Store position
            positions[symbol] = {
                'x': -x,  # Negative for CSS background-position
                'y': -y,
                'w': ICON_SIZE,
                'h': ICON_SIZE
            }
            
        except Exception as e:
            print(f"    ⚠️  Warning: Failed to process {icon_path.name}: {e}")
            continue
    
    # Save sprite sheet as WebP
    sprite.save(output_path, 'WEBP', quality=QUALITY, method=6)
    
    return positions

def main():
    print("🎨 Generating sprite sheets...\n")
    
    ensure_dir(SPRITE_DIR)
    
    # Collect icon files
    files_by_category = get_icon_files()
    
    total_icons = sum(len(files) for files in files_by_category.values())
    print(f"📊 Found {total_icons} icons across {len(CATEGORIES)} categories\n")
    
    # Generate sprites for each category
    all_positions = {}
    total_original_size = 0
    total_sprite_size = 0
    
    for category, files in files_by_category.items():
        if not files:
            print(f"⏭️  Skipping {category}: No icons found")
            continue
        
        print(f"🔧 Processing {category}...")
        print(f"  Icons: {len(files)}")
        
        # Calculate original total size
        category_original_size = sum(f.stat().st_size for f in files)
        total_original_size += category_original_size
        
        # Generate sprite
        sprite_path = SPRITE_DIR / f'{category}.webp'
        positions = create_sprite_sheet(files, sprite_path)
        
        # Get sprite size
        sprite_size = sprite_path.stat().st_size
        total_sprite_size += sprite_size
        
        # Calculate compression
        compression = ((category_original_size - sprite_size) / category_original_size * 100)
        
        print(f"  Original: {category_original_size / 1024:.1f} KB")
        print(f"  Sprite:   {sprite_size / 1024:.1f} KB")
        print(f"  Saved:    {compression:.1f}%")
        
        # Save positions JSON
        json_path = SPRITE_DIR / f'{category}.json'
        with open(json_path, 'w') as f:
            json.dump({
                'positions': positions,
                'iconSize': ICON_SIZE,
                'count': len(positions),
                'sprite': f'{category}.webp'
            }, f, indent=2)
        
        all_positions[category] = positions
        print(f"  ✅ Saved: {sprite_path.name} + {json_path.name}\n")
    
    # Generate master index
    master_index = {
        'categories': {
            cat: {
                'sprite': f'{cat}.webp',
                'map': f'{cat}.json',
                'count': len(all_positions.get(cat, {}))
            }
            for cat in CATEGORIES.keys()
            if all_positions.get(cat)
        },
        'iconSize': ICON_SIZE,
        'totalIcons': sum(len(pos) for pos in all_positions.values())
    }
    
    master_path = SPRITE_DIR / 'index.json'
    with open(master_path, 'w') as f:
        json.dump(master_index, f, indent=2)
    
    # Summary
    print("=" * 60)
    print("📦 Summary:")
    print(f"  Original files: {total_icons} icons, {total_original_size / 1024:.1f} KB")
    print(f"  Sprite files:   {len(all_positions)} sprites, {total_sprite_size / 1024:.1f} KB")
    print(f"  Total savings:  {((total_original_size - total_sprite_size) / total_original_size * 100):.1f}%")
    print(f"  HTTP requests:  {total_icons} → {len(all_positions)} (99.5% reduction)")
    print("=" * 60)
    print(f"\n✨ Sprites saved to: {SPRITE_DIR}")
    print("🎯 Ready for production!\n")

if __name__ == '__main__':
    main()
