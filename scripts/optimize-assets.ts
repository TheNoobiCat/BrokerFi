#!/usr/bin/env node
/**
 * Asset Optimization Build Script
 * 
 * Generates optimized asset index files for enterprise-grade performance:
 * - Minimal index for fast initial load (~15 KB gzipped)
 * - Compressed format with shortened keys
 * - Preserves descriptions (shown in sidebar)
 * - Category-based splitting for progressive loading
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { gzipSync } from 'zlib'

interface FullAsset {
  pyth_id: string
  symbol: string
  display: string
  description: string
}

interface OptimizedAsset {
  i: string  // pyth_id (first 16 chars for uniqueness)
  s: string  // symbol
  d: string  // display
  n: string  // name/description (kept for sidebar!)
  t: 'c' | 's' | 'f' | 'x'  // type
  cs?: 1  // comingSoon flag
  p?: 1  // popular flag
  f?: 1  // default favorite flag
}

interface FullAssetData {
  us_stocks: FullAsset[]
  us_stocks_coming_soon: FullAsset[]
  commodities: FullAsset[]
  crypto_pairs: FullAsset[]
  forex_pairs: FullAsset[]
  summary: {
    total_us_stocks: number
    total_us_stocks_coming_soon: number
    total_commodities: number
    total_crypto_pairs: number
    total_usd_forex_pairs: number
    grand_total: number
  }
}

const TYPE_MAP: Record<string, 'c' | 's' | 'f' | 'x'> = {
  crypto_pairs: 'c',
  us_stocks: 's',
  forex_pairs: 'f',
  commodities: 'x'
}

function optimizeAsset(asset: FullAsset, type: 'c' | 's' | 'f' | 'x', comingSoon = false, popular = false): OptimizedAsset {
  return {
    i: asset.pyth_id.substring(0, 16), // 16 chars is enough for uniqueness
    s: asset.symbol,
    d: asset.display,
    n: asset.description, // Keep full description for sidebar display
    t: type,
    ...(comingSoon ? { cs: 1 as const } : {}),
    ...(popular ? { p: 1 as const } : {})
  }
}

function main() {
  const inputPath = join(process.cwd(), 'scripts', 'assetslister', 'pyth_feeds_organized.json')
  const popularPath = join(process.cwd(), 'scripts', 'popular-assets.json')
  const outputDir = join(process.cwd(), 'public', 'data')
  
  console.log('🚀 Starting asset optimization...\n')
  
  // Load popular assets list
  let popularSymbols: string[] = []
  try {
    const popularData = JSON.parse(readFileSync(popularPath, 'utf-8'))
    popularSymbols = (popularData.popular || []).map((s: string) => s.toUpperCase())
    console.log(`⭐ Loaded ${popularSymbols.length} popular assets from config`)
  } catch (error) {
    console.warn('⚠️  Could not load popular-assets.json, no assets will be marked as popular')
  }

  // Helper to check if asset is popular
  const isPopular = (asset: FullAsset): boolean => {
    return popularSymbols.some(pop => 
      asset.symbol.toUpperCase().includes(pop) || 
      asset.display.toUpperCase().includes(pop)
    )
  }
  
  // Ensure output directory exists
  mkdirSync(outputDir, { recursive: true })
  
  // Read source data
  const sourceData: FullAssetData = JSON.parse(readFileSync(inputPath, 'utf-8'))
  
  // Build optimized structures
  const optimizedIndex: {
    c: OptimizedAsset[]  // crypto
    s: OptimizedAsset[]  // stocks
    f: OptimizedAsset[]  // forex
    x: OptimizedAsset[]  // commodities
    v: number            // version timestamp
  } = {
    c: [],
    s: [],
    f: [],
    x: [],
    v: Date.now()
  }
  
  // Process crypto
  for (const asset of sourceData.crypto_pairs) {
    optimizedIndex.c.push(optimizeAsset(asset, 'c', false, isPopular(asset)))
  }
  
  // Process stocks (including coming soon)
  for (const asset of sourceData.us_stocks) {
    optimizedIndex.s.push(optimizeAsset(asset, 's', false, isPopular(asset)))
  }
  for (const asset of sourceData.us_stocks_coming_soon) {
    optimizedIndex.s.push(optimizeAsset(asset, 's', true, isPopular(asset)))
  }
  
  // Process forex
  for (const asset of sourceData.forex_pairs) {
    optimizedIndex.f.push(optimizeAsset(asset, 'f', false, isPopular(asset)))
  }
  
  // Process commodities
  for (const asset of sourceData.commodities) {
    optimizedIndex.x.push(optimizeAsset(asset, 'x', false, isPopular(asset)))
  }
  
  // Sort all arrays by symbol for better compression
  optimizedIndex.c.sort((a, b) => a.s.localeCompare(b.s))
  optimizedIndex.s.sort((a, b) => a.s.localeCompare(b.s))
  optimizedIndex.f.sort((a, b) => a.s.localeCompare(b.s))
  optimizedIndex.x.sort((a, b) => a.s.localeCompare(b.s))
  
  // Write main index (all assets)
  const indexJson = JSON.stringify(optimizedIndex)
  const indexPath = join(outputDir, 'assets-index.json')
  writeFileSync(indexPath, indexJson, 'utf-8')
  
  // Calculate sizes
  const originalSize = readFileSync(inputPath).length
  const optimizedSize = Buffer.from(indexJson).length
  const gzippedSize = gzipSync(Buffer.from(indexJson)).length
  
  console.log('📊 Optimization Results:')
  console.log('─────────────────────────────────────────')
  console.log(`Original file:     ${(originalSize / 1024).toFixed(2)} KB`)
  console.log(`Optimized file:    ${(optimizedSize / 1024).toFixed(2)} KB (${((1 - optimizedSize / originalSize) * 100).toFixed(1)}% reduction)`)
  console.log(`Gzipped size:      ${(gzippedSize / 1024).toFixed(2)} KB (${((1 - gzippedSize / originalSize) * 100).toFixed(1)}% reduction)`)
  console.log('─────────────────────────────────────────')
  console.log(`\n✅ Crypto:        ${optimizedIndex.c.length} assets`)
  console.log(`✅ Stocks:        ${optimizedIndex.s.length} assets`)
  console.log(`✅ Forex:         ${optimizedIndex.f.length} assets`)
  console.log(`✅ Commodities:   ${optimizedIndex.x.length} assets`)
  console.log(`─────────────────────────────────────────`)
  console.log(`📦 Total:         ${optimizedIndex.c.length + optimizedIndex.s.length + optimizedIndex.f.length + optimizedIndex.x.length} assets`)
  
  // Also write category-specific files for progressive loading
  writeFileSync(join(outputDir, 'assets-crypto.json'), JSON.stringify({ c: optimizedIndex.c, v: optimizedIndex.v }), 'utf-8')
  writeFileSync(join(outputDir, 'assets-stocks.json'), JSON.stringify({ s: optimizedIndex.s, v: optimizedIndex.v }), 'utf-8')
  writeFileSync(join(outputDir, 'assets-forex.json'), JSON.stringify({ f: optimizedIndex.f, v: optimizedIndex.v }), 'utf-8')
  writeFileSync(join(outputDir, 'assets-commodities.json'), JSON.stringify({ x: optimizedIndex.x, v: optimizedIndex.v }), 'utf-8')
  
  console.log(`\n✨ Optimized assets written to: ${outputDir}`)
  console.log('🎯 Ready for production deployment!\n')
}

main()
