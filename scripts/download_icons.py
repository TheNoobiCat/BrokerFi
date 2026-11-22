#!/usr/bin/env python3
"""
Download icons for all assets listed in assetslister/pyth_feeds_organized.json.

Behavior:
- For `crypto` assets use Logokit: https://img.logokit.com/crypto/{SYMBOL}?token=TOKEN
- For `stocks` assets use Logokit: https://img.logokit.com/ticker/{SYMBOL}?token=TOKEN
- For other asset types, generate a simple SVG initials fallback locally.
- Respects simple per-symbol and global rate limits and handles 429 backoff.
- Saves files to `public/icons` as `type_symbol.png` or `.svg`.

Usage:
  pip install requests
  python scripts/download_icons.py

Options (edit at top of file):
  - LOGOKIT_TOKEN: required environment variable containing your own Logokit API token.
  - INPUT_JSON: default `assetslister/pyth_feeds_organized.json`.
  - OUT_DIR: default `public/icons`.

The script exits with an error if LOGOKIT_TOKEN is not set. Never commit a
token value; export it in your shell or use a local, untracked env file.

"""

import json
import os
import re
import time
import sys
import random
from pathlib import Path
from typing import Dict, Any

try:
    import requests
except ImportError:
    print("Please install requests first: pip install requests")
    sys.exit(1)

# Configuration
LOGOKIT_TOKEN = os.environ.get("LOGOKIT_TOKEN", "")
INPUT_JSON = Path("assetslister/pyth_feeds_organized.json")
OUT_DIR = Path("public/icons")
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Rate limiting (approximate, mirror route.ts)
MIN_REQUEST_INTERVAL = 0.2  # seconds per-symbol (increased from 0.1)
GLOBAL_MIN_INTERVAL = 0.6  # seconds between global requests (increased from 0.2)

# Backoff on 429
PER_SYMBOL_BACKOFF = 60  # seconds to skip a symbol after 429
GLOBAL_BACKOFF = 5  # seconds backoff on global 429

# Additional retry parameters
MAX_RETRIES = 2
RETRY_BASE_SLEEP = 1.0

# Basic headers for logokit fetch
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    "Referer": "https://logokit.com/",
}

# Helper functions

def sanitize_symbol_for_filename(s: str) -> str:
    return re.sub(r"[^a-z0-9-]", "_", s.lower())


def write_atomic(path: Path, data: bytes) -> None:
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_bytes(data)
    tmp.replace(path)


def svg_initials(symbol: str) -> bytes:
    initials = re.sub(r"[^A-Z0-9]", "", symbol.upper())[:3] or symbol.upper()[:3]
    svg = (
        "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n"
        "<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'>\n"
        "  <rect width='100%' height='100%' rx='8' fill='#0f172a' />\n"
        f"  <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Inter, Arial, sans-serif' font-size='24' font-weight='700' fill='#ffffff'>{initials}</text>\n"
        "</svg>"
    )
    return svg.encode("utf-8")


def fetch_logokit(url: str, timeout: int = 8) -> (int, Dict[str, str], bytes):
    try:
        r = requests.get(url, headers=HEADERS, timeout=timeout)
        return r.status_code, r.headers, r.content
    except Exception as e:
        return 0, {}, b""


def main():
    if not LOGOKIT_TOKEN:
        print(
            "Error: LOGOKIT_TOKEN is not set. Export a Logokit API token before "
            "running this script, e.g. `export LOGOKIT_TOKEN=...`.",
            file=sys.stderr,
        )
        sys.exit(1)

    if not INPUT_JSON.exists():
        print(f"Input JSON not found: {INPUT_JSON}", file=sys.stderr)
        return

    with INPUT_JSON.open("r", encoding="utf-8") as f:
        data = json.load(f)

    # asset categories are keys like 'us_stocks', 'crypto_pairs', etc.
    last_request_time: Dict[str, float] = {}
    last_global_request = 0.0

    total = 0
    skipped_existing = 0
    downloaded = 0
    generated_svg = 0

    # Iterate categories
    for category, assets in data.items():
        if not isinstance(assets, list):
            continue

        # Map category -> type string used by route.ts and filenames
        if category.startswith("us_stocks"):
            typ = "stock"
        elif category.startswith("crypto"):
            typ = "crypto"
        elif category.startswith("forex"):
            typ = "forex"
        else:
            typ = "commodity"

        for asset in assets:
            total += 1
            symbol = asset.get("symbol")
            if not symbol:
                continue

            # Construct filename. Route.ts expects 'symbol' param often as urlSlug (e.g. 'stock-aapl')
            # We'll name files like '{type}_{sanitized_symbol}.{ext}'
            # Some asset sources include a type prefix in the symbol (e.g. "stock-aapl").
            # Strip known type prefixes to avoid filenames like "stock_stock-aapl".
            symbol_no_prefix = re.sub(r'^(stock|crypto|forex|commodity)-', '', symbol, flags=re.IGNORECASE)
            sanitized = sanitize_symbol_for_filename(symbol_no_prefix)
            base = f"{typ}_{sanitized}"
            png_path = OUT_DIR / (base + ".png")
            svg_path = OUT_DIR / (base + ".svg")

            # Skip if a file already exists
            if png_path.exists() or svg_path.exists():
                skipped_existing += 1
                continue

            clean_symbol = symbol.upper()

            # Build logokit URL only for crypto & stock
            logokit_url = None
            if typ == "crypto":
                logokit_url = f"https://img.logokit.com/crypto/{clean_symbol}?token={LOGOKIT_TOKEN}"
            elif typ == "stock":
                logokit_url = f"https://img.logokit.com/ticker/{clean_symbol}?token={LOGOKIT_TOKEN}"

            # Rate limiting: per-symbol and global (with jitter)
            now = time.time()
            last_sym = last_request_time.get(clean_symbol, 0)
            since_sym = now - last_sym
            if since_sym < MIN_REQUEST_INTERVAL:
                time.sleep(MIN_REQUEST_INTERVAL - since_sym)

            since_global = now - last_global_request
            if since_global < GLOBAL_MIN_INTERVAL:
                time.sleep(GLOBAL_MIN_INTERVAL - since_global)

            # Update timings
            last_request_time[clean_symbol] = time.time()
            last_global_request = time.time()

            # Try logokit if available, with a couple of quick retry attempts
            if logokit_url:
                attempt = 0
                status = 0
                headers = {}
                content = b""
                while attempt <= MAX_RETRIES:
                    status, headers, content = fetch_logokit(logokit_url)
                    print(f"{symbol} -> logokit {status} (attempt {attempt + 1})")
                    if status == 200 or status == 429:
                        break
                    # on transient failures, sleep with exponential backoff and retry
                    attempt += 1
                    sleep_for = RETRY_BASE_SLEEP * (2 ** (attempt - 1)) + random.uniform(0, 0.2)
                    time.sleep(sleep_for)
                if status == 200:
                    ctype = headers.get("content-type", "")
                    try:
                        if "svg" in ctype or content.strip().startswith(b"<"):
                            write_atomic(svg_path, content)
                            downloaded += 1
                        else:
                            write_atomic(png_path, content)
                            downloaded += 1
                        continue
                    except Exception as e:
                        print(f"Failed to save logokit response for {symbol}: {e}")

                if status == 429:
                    # backoff this symbol and a small global delay
                    print(f"Received 429 for {symbol}, backing off {PER_SYMBOL_BACKOFF}s")
                    last_request_time[clean_symbol] = time.time() + PER_SYMBOL_BACKOFF
                    last_global_request = time.time() + GLOBAL_BACKOFF
                    # fallback to generating svg below

            # Fallback: generate SVG initials
            try:
                svg_bytes = svg_initials(symbol)
                write_atomic(svg_path, svg_bytes)
                generated_svg += 1
            except Exception as e:
                print(f"Failed to generate SVG for {symbol}: {e}")

            # Small pause between symbols to avoid hitting rate limits; add jitter
            time.sleep(GLOBAL_MIN_INTERVAL + random.uniform(0, 0.15))

    print("Done.")
    print(f"Total assets processed: {total}")
    print(f"Skipped existing: {skipped_existing}")
    print(f"Downloaded from logokit: {downloaded}")
    print(f"Generated SVG fallbacks: {generated_svg}")


if __name__ == "__main__":
    main()
