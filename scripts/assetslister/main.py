import requests
import json
import time

# Fetch the data from Pyth Network API
url = "https://hermes.pyth.network/v2/price_feeds"
response = requests.get(url)
data = response.json()

# Function to verify if a stock has real data from Pyth
def verify_stock_has_data(pyth_id, symbol):
    """
    Test if Pyth actually has historical data for this stock by trying to fetch 1 day of data.
    Returns True if real data exists, False otherwise.
    """
    try:
        # Try the TradingView shim endpoint with the correct Pyth format
        test_url = f"https://benchmarks.pyth.network/v1/shims/tradingview/history"
        
        # Use current time and go back 7 days to get some data
        to_time = int(time.time())
        from_time = to_time - (7 * 24 * 60 * 60)  # 7 days ago
        
        # Try Pyth API format first (most likely to work)
        symbol_format = f"Equity.US.{symbol}/USD"
        
        params = {
            'symbol': symbol_format,
            'resolution': 'D',  # Daily data
            'from': from_time,
            'to': to_time
        }
        
        response = requests.get(test_url, params=params, timeout=10)
        
        if response.ok:
            data = response.json()
            # Check if we got actual data (not just an OK status with empty arrays)
            if data.get('s') == 'ok' and data.get('t') and len(data.get('t', [])) > 0:
                return True
        
        # If first format failed, try without /USD suffix
        symbol_format = f"Equity.US.{symbol}"
        params['symbol'] = symbol_format
        response = requests.get(test_url, params=params, timeout=10)
        
        if response.ok:
            data = response.json()
            if data.get('s') == 'ok' and data.get('t') and len(data.get('t', [])) > 0:
                return True
                
        return False
        
    except Exception as e:
        print(f"  ⚠️  Error verifying {symbol}: {e}")
        return False

# Load US stocks from file
try:
    with open('all_tickers.txt', 'r') as f:
        us_stocks = [line.strip().upper() for line in f if line.strip()]
    print(f"Loaded {len(us_stocks)} US stock tickers from all_tickers.txt")
except FileNotFoundError:
    print("ERROR: all_tickers.txt not found!")
    print("Please create a file called 'all_tickers.txt' with one ticker per line.")
    exit(1)

# Blacklisted stocks (delisted or no real data from Pyth)
blacklisted_stocks = ['BYND']  # Beyond Meat - listed in API but no actual data feeds

# Common commodity keywords to detect commodities/metals/oil from Pyth feed
commodity_keywords = [
    'XAU', 'GOLD',
    'XAG', 'SILVER',
    'XPT', 'PLATINUM',
    'XPD', 'PALLADIUM',
    'BRENT', 'UKOIL', 'UKOILSPOT',
    'WTI', 'CRUDE', 'OIL'
]

# Main Binance derivatives crypto pairs
binance_crypto = [
    'BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'DOT', 'MATIC', 'SHIB', 'LTC',
    'TRX', 'AVAX', 'UNI', 'LINK', 'ATOM', 'XMR', 'ETC', 'BCH', 'NEAR', 'APT', 'FIL',
    'ARB', 'OP', 'IMX', 'STX', 'INJ', 'SUI', 'SEI', 'WLD', 'TIA', 'ORDI', 'RNDR',
    'FTM', 'GRT', 'AAVE', 'MKR', 'SNX', 'RUNE', 'ICP', 'ALGO', 'VET', 'FLOW', 'SAND',
    'AXS', 'MANA', 'GALA', 'APE', 'LDO', 'CRV', 'BLUR', 'COMP', 'YFI', 'SUSHI', 'BAL',
    'ZRX', 'PEPE', 'WIF', 'BONK', 'FLOKI', 'PYTH', 'JUP', 'ONDO', 'STRK', 'DYM',
    'MEME', 'ALT', 'JTO', 'PENDLE', 'ENA', 'W', 'SAGA', 'OMNI', 'REZ', 'BB', 'NOT',
    'IO', 'ZK', 'ZRO', 'LISTA', 'DOGS', 'TON', 'BANANA', 'RARE', 'RENDER'
]

# Parse the data
stocks = []
stocks_failed_verification = []  # Track stocks that failed verification
commodities = []
crypto_pairs = []
forex_pairs = []

# First, collect all stocks to verify
stocks_to_verify = []
for item in data:
    pyth_id = item.get('id', '')
    attrs = item.get('attributes', {})
    asset_type = attrs.get('asset_type', '')
    base = attrs.get('base', '')
    display = attrs.get('display_symbol', '')
    description = attrs.get('description', '')
    
    if asset_type == 'Equity' and attrs.get('country') == 'US':
        if base in us_stocks:
            # If the stock is explicitly blacklisted (known to have no data), treat
            # it as a "coming soon" asset so it still appears in the UI but
            # is shown greyed out and not selectable.
            if base in blacklisted_stocks:
                stocks_failed_verification.append({
                    'pyth_id': pyth_id,
                    'symbol': base,
                    'display': display,
                    'description': description
                })
                continue

            if 'PRE MARKET' not in display and 'POST MARKET' not in display and 'OVERNIGHT' not in display:
                stocks_to_verify.append({
                    'pyth_id': pyth_id,
                    'symbol': base,
                    'display': display,
                    'description': description
                })

print("\n" + "=" * 100)
print(f"VERIFYING {len(stocks_to_verify)} STOCKS FOR DATA AVAILABILITY")
print("=" * 100)

# Now verify each stock
for idx, stock_data in enumerate(stocks_to_verify, 1):
    base = stock_data['symbol']
    pyth_id = stock_data['pyth_id']
    
    print(f"[{idx}/{len(stocks_to_verify)}] Verifying {base:6}... ", end='', flush=True)
    
    if verify_stock_has_data(pyth_id, base):
        print("[OK] HAS DATA")
        stocks.append(stock_data)
    else:
        print("[X] NO DATA")
        stocks_failed_verification.append(stock_data)
    
    # Rate limit - be nice to Pyth's API
    time.sleep(0.3)

# Continue parsing other asset types
for item in data:
    pyth_id = item.get('id', '')
    attrs = item.get('attributes', {})
    asset_type = attrs.get('asset_type', '')
    base = attrs.get('base', '')
    display = attrs.get('display_symbol', '')
    description = attrs.get('description', '')
   
    # Filter commodities and metals (gold, silver, oil, etc.)
    if asset_type in ('Commodities', 'Metal'):
        # Check multiple fields for keyword matches to catch different naming conventions
        search_fields = ' '.join([
            str(base or ''),
            str(display or ''),
            str(description or ''),
            str(attrs.get('generic_symbol', '') or ''),
            str(attrs.get('symbol', '') or '')
        ]).upper()

        matched = False
        for kw in commodity_keywords:
            if kw.upper() in search_fields:
                commodities.append({
                    'pyth_id': pyth_id,
                    'symbol': base,
                    'display': display,
                    'description': description,
                    'asset_type': asset_type
                })
                matched = True
                break

        # As a fallback, include broadly-named commodities (e.g. display contains 'OIL' or 'CRUDE')
        if not matched and any(x in search_fields for x in ('OIL', 'CRUDE', 'BRENT', 'WTI')):
            commodities.append({
                'pyth_id': pyth_id,
                'symbol': base,
                'display': display,
                'description': description,
                'asset_type': asset_type
            })
   
    # Filter crypto
    if asset_type == 'Crypto':
        if base in binance_crypto:
            # Store as full USD pair to match Pyth Network convention
            symbol = f"{base}USD" if not base.endswith('USD') else base
            crypto_pairs.append({
                'pyth_id': pyth_id,
                'symbol': symbol,
                'display': display,
                'description': description
            })
   
    # Filter forex - only USD pairs
    if asset_type == 'FX':
        # Only include pairs that have USD in them (either as base or quote)
        if 'USD' in display or 'USD' in base or 'USD' in description:
            # Further filter to only include major USD pairs
            major_usd_pairs = [
                'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'USD/CAD', 'AUD/USD', 'NZD/USD',
                'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'USDCAD', 'AUDUSD', 'NZDUSD',
                'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD'
            ]
            
            # Check if this pair contains any of the major currencies with USD
            is_major_usd_pair = any(
                major in display.upper() or major in base.upper() or major in description.upper()
                for major in major_usd_pairs
            )
            
            if is_major_usd_pair:
                forex_pairs.append({
                    'pyth_id': pyth_id,
                    'symbol': base,
                    'display': display,
                    'description': description
                })

# Sort all lists
stocks.sort(key=lambda x: x['symbol'])
commodities.sort(key=lambda x: x['symbol'])
crypto_pairs.sort(key=lambda x: x['symbol'])
forex_pairs.sort(key=lambda x: x['symbol'])

# Print results
print("\n" + "=" * 100)
print("US STOCKS (VERIFIED - with real Pyth data)")
print("=" * 100)
for item in stocks:
    print(f"{item['symbol']:10} | {item['pyth_id'][:8]:8}... | {item['display']:20} | {item['description']}")
print(f"\nTotal: {len(stocks)} stocks with real data\n")

if stocks_failed_verification:
    print("=" * 100)
    print("STOCKS FAILED VERIFICATION (listed in API but no actual data)")
    print("=" * 100)
    for item in stocks_failed_verification:
        print(f"{item['symbol']:10} | {item['pyth_id'][:8]:8}... | {item['display']:20} | {item['description']}")
    print(f"\nTotal: {len(stocks_failed_verification)} stocks WITHOUT real data\n")

print("=" * 100)
print("US STOCKS (from all_tickers.txt and Pyth Network)")
print("=" * 100)
for item in stocks:
    print(f"{item['symbol']:10} | {item['pyth_id'][:8]:8}... | {item['display']:20} | {item['description']}")
print(f"\nTotal: {len(stocks)} stocks\n")

print("=" * 100)
print("COMMODITIES (from Pyth Network)")
print("=" * 100)
for item in commodities:
    print(f"{item['symbol']:10} | {item['pyth_id'][:8]:8}... | {item['display']:20} | {item['description']}")
print(f"\nTotal: {len(commodities)} commodities\n")

print("=" * 100)
print("MAIN CRYPTO PAIRS ON BINANCE DERIVATIVES (from Pyth Network)")
print("=" * 100)
for item in crypto_pairs:
    print(f"{item['symbol']:10} | {item['pyth_id'][:8]:8}... | {item['display']:20} | {item['description']}")
print(f"\nTotal: {len(crypto_pairs)} crypto pairs\n")

print("=" * 100)
print("MAJOR USD FOREX PAIRS (from Pyth Network)")
print("=" * 100)
for item in forex_pairs:
    print(f"{item['symbol']:10} | {item['pyth_id'][:8]:8}... | {item['display']:20} | {item['description']}")
print(f"\nTotal: {len(forex_pairs)} USD forex pairs\n")

# Save to one organized JSON file
output = {
    "us_stocks": stocks,
    "us_stocks_coming_soon": stocks_failed_verification,  # Stocks without data yet
    "commodities": commodities,
    "crypto_pairs": crypto_pairs,
    "forex_pairs": forex_pairs,
    "summary": {
        "total_us_stocks": len(stocks),
        "total_us_stocks_coming_soon": len(stocks_failed_verification),
        "total_commodities": len(commodities),
        "total_crypto_pairs": len(crypto_pairs),
        "total_usd_forex_pairs": len(forex_pairs),
        "grand_total": len(stocks) + len(commodities) + len(crypto_pairs) + len(forex_pairs)
    }
}
with open('pyth_feeds_organized.json', 'w') as f:
    json.dump(output, f, indent=2)
print("\nData saved to: pyth_feeds_organized.json")