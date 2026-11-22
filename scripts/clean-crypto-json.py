#!/usr/bin/env python3
"""
Remove specified missing keys from public/sprites/crypto.json
Usage: python scripts/clean-crypto-json.py
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(__file__))
JSON_PATH = os.path.join(ROOT, 'public', 'sprites', 'crypto.json')

REMOVE_BASES = ['alt','bonk','dym','io','render','rez','wif']

if not os.path.exists(JSON_PATH):
    print('crypto.json not found:', JSON_PATH)
    raise SystemExit(1)

with open(JSON_PATH, 'r', encoding='utf-8') as f:
    data = json.load(f)

positions = data.get('positions', {})
removed = []
for base in REMOVE_BASES:
    keys = [base, f'crypto-{base}', f'{base}usd', base.upper(), f'{base}USD']
    for k in keys:
        if k in positions:
            positions.pop(k)
            removed.append(k)

# Also ensure we remove any exact original-symbol forms like 'altusd' if present
for base in REMOVE_BASES:
    alt_key = f'{base}usd'
    if alt_key in positions:
        positions.pop(alt_key)
        removed.append(alt_key)

data['positions'] = positions
with open(JSON_PATH, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2)

print('Removed keys:', removed)
print('Remaining keys count:', len(positions))
