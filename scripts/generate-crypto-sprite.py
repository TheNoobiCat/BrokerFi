#!/usr/bin/env python3
"""
Generate a crypto sprite sheet and JSON map by downloading icons from
https://raw.githubusercontent.com/Cryptofonts/cryptoicons/master/{size}/{symbol}.png

Usage: python scripts/generate-crypto-sprite.py [size]
size: 16, 32, or 64 (default 64)

Output:
  public/sprites/crypto.webp
  public/sprites/crypto.json

This script uses only the Python standard library + Pillow. Install Pillow with:
  pip install pillow requests

"""
import os
import sys
import math
import json
import errno
from io import BytesIO

try:
    from PIL import Image
except ImportError:
    print("Pillow is required. Run: pip install pillow requests")
    sys.exit(1)

try:
    import requests
except ImportError:
    print("requests is required. Run: pip install requests pillow")
    sys.exit(1)

ROOT = os.path.dirname(os.path.dirname(__file__))
PUBLIC_SPRITES = os.path.join(ROOT, 'public', 'sprites')
ICONS_DIR = os.path.join(ROOT, 'public', 'icons')

DEFAULT_SIZE = 64
SIZES = [16, 32, 64]

# A conservative list of crypto symbols to include; will try to match asset symbols
# This can be extended or replaced with dynamic list from /public/data/assets-crypto.json
COMMON_SYMBOLS = [
    'btc','eth','sol','ada','xrp','dot','avax','link','ltc','doge','bnb','uni','atom','fil','ftm','aave','sush','man','trx','xlm','eos','zec','xtz','near','algo','shib','mkr','chz','crv','rnd'
]

CRYPTO_BASE_URL = 'https://raw.githubusercontent.com/Cryptofonts/cryptoicons/master/{size}/{sym}.png'

os.makedirs(PUBLIC_SPRITES, exist_ok=True)


def fetch_icon(sym: str, size: int):
    url = CRYPTO_BASE_URL.format(size=size, sym=sym)
    try:
        r = requests.get(url, timeout=10)
        if r.status_code == 200:
            return Image.open(BytesIO(r.content)).convert('RGBA')
    except Exception as e:
        return None
    return None


def main():
    size = DEFAULT_SIZE
    if len(sys.argv) > 1:
        try:
            s = int(sys.argv[1])
            if s in SIZES:
                size = s
        except:
            pass

    # If optimized crypto asset index exists, derive symbols from it to include all assets
    # Use the actual symbols from the optimized assets JSON. For fetching we
    # use the base token name (strip trailing 'USD' when present), but keep
    # the original symbol so we can generate mapping keys that match the app
    symbols = []
    assets_crypto_path = os.path.join(ROOT, 'public', 'data', 'assets-crypto.json')
    asset_symbol_pairs = []  # list of (orig_symbol_lower, base)
    if os.path.exists(assets_crypto_path):
        try:
            with open(assets_crypto_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                c = data.get('c') or data.get('crypto') or []
                for item in c:
                    s_raw = str(item.get('s', '')).strip()
                    if not s_raw:
                        continue
                    s = s_raw.lower()
                    # compute base used by Cryptofonts (strip trailing 'usd')
                    if s.endswith('usd') and len(s) > 3:
                        base = s[:-3]
                    else:
                        base = s
                    base = ''.join(ch for ch in base if ch.isalnum())
                    if not base:
                        continue
                    asset_symbol_pairs.append((s, base))
        except Exception:
            asset_symbol_pairs = []

    # Fallback to hardcoded list when parsing failed
    if not asset_symbol_pairs:
        asset_symbol_pairs = [(sym + 'usd' if not sym.endswith('usd') else sym, sym) for sym in COMMON_SYMBOLS]

    icons = []
    names = []
    # asset_symbol_pairs contains tuples of (orig_symbol_lower, base)
    fetch_targets = []
    for orig, base in asset_symbol_pairs:
        if base and base not in fetch_targets:
            fetch_targets.append(base)

    print(f"Fetching {len(fetch_targets)} icons at {size}px...")
    for base in fetch_targets:
        img = fetch_icon(base, size)
        if img is None:
            print(f" - missing: {base}")
            continue
        # Ensure icon is square of requested size
        # We'll add padding inside each sprite cell so icons have whitespace
        pad = max(2, int(round(size * 0.12)))
        inner = size - pad * 2
        if inner <= 0:
            inner = max(1, size - 4)
        # Resize icon to inner size preserving alpha
        if img.width != inner or img.height != inner:
            img_resized = img.resize((inner, inner), Image.LANCZOS)
        else:
            img_resized = img
        # Create a cell image with white background and paste the resized icon centered with padding
        cell = Image.new('RGBA', (size, size), (255, 255, 255, 255))
        cell.paste(img_resized, (pad, pad), img_resized if img_resized.mode == 'RGBA' else None)
        icons.append(cell)
        names.append(base)

    if not icons:
        print('No icons downloaded; aborting')
        return

    # Sprite layout: place icons in rows of 20 (like existing implementation)
    per_row = 20
    count = len(icons)
    rows = math.ceil(count / per_row)
    sprite_w = per_row * size
    sprite_h = rows * size

    # Use white background so icons with transparency render on white
    sprite = Image.new('RGBA', (sprite_w, sprite_h), (255, 255, 255, 255))

    positions = {}
    # Build positions and include multiple keys per base icon. Also include
    # exact original symbols (from assets JSON) where applicable.
    base_to_pos = {}
    for idx, (base, img) in enumerate(zip(names, icons)):
        row = idx // per_row
        col = idx % per_row
        x = col * size
        y = row * size
        # Paste with mask so transparency composes over white background
        sprite.paste(img, (x, y), img if img.mode == 'RGBA' else None)
        base_to_pos[base] = {"x": -x, "y": -y, "w": size, "h": size}

    # Add entries for each original asset symbol
    for orig, base in asset_symbol_pairs:
        # orig like 'aaveusd' (lowercased), base like 'aave'
        if base in base_to_pos:
            pos = base_to_pos[base]
            # keys to include: original exact symbol, plain base, crypto-base, base+usd
            positions[orig] = pos
            positions[base] = pos
            positions[f"crypto-{base}"] = pos
            positions[f"{base}usd"] = pos
        else:
            # If base icon wasn't downloaded, skip
            continue

    # Save sprite as webp
    sprite_path = os.path.join(PUBLIC_SPRITES, 'crypto.webp')
    sprite.save(sprite_path, 'WEBP', quality=90, method=6)
    print(f"Saved sprite: {sprite_path}")

    # Write json map
    map_data = {
        'positions': positions,
        'iconSize': size,
        'count': count,
        'sprite': 'crypto.webp'
    }

    json_path = os.path.join(PUBLIC_SPRITES, 'crypto.json')
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(map_data, f, indent=2)
    print(f"Saved map: {json_path}")


if __name__ == '__main__':
    main()
