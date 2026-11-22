#!/usr/bin/env python3
"""
Remove specific missing symbols from public/data/assets-crypto.json
Usage: python scripts/remove-missing-assets.py
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(__file__))
JSON_PATH = os.path.join(ROOT, 'public', 'data', 'assets-crypto.json')
REMOVE_UPPER = ['ALTUSD','BONKUSD','DYMUSD','IOUSD','RENDERUSD','REZUSD','WIFUSD']

if not os.path.exists(JSON_PATH):
    print('assets-crypto.json not found:', JSON_PATH)
    raise SystemExit(1)

with open(JSON_PATH, 'r', encoding='utf-8') as f:
    data = json.load(f)

c = data.get('c', [])
orig_len = len(c)

c_filtered = [item for item in c if str(item.get('s','')).upper() not in REMOVE_UPPER]
removed_count = orig_len - len(c_filtered)

data['c'] = c_filtered

with open(JSON_PATH, 'w', encoding='utf-8') as f:
    json.dump(data, f)

print(f'Removed {removed_count} entries from assets-crypto.json')
