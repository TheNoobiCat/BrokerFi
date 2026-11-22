#!/usr/bin/env node
/**
 * Verification Script for BrokerFi Optimizations
 * Checks that all optimization files are present and correctly formatted
 */

import { readFileSync, existsSync, statSync } from 'fs'
import { join } from 'path'
import { gzipSync } from 'zlib'

interface CheckResult {
  name: string
  status: 'pass' | 'fail' | 'warn'
  message: string
  details?: string
}

const results: CheckResult[] = []

function check(name: string, condition: boolean, passMsg: string, failMsg: string, details?: string) {
  results.push({
    name,
    status: condition ? 'pass' : 'fail',
    message: condition ? passMsg : failMsg,
    details
  })
}

function checkFileExists(path: string, name: string) {
  const exists = existsSync(path)
  check(
    name,
    exists,
    `✅ ${name} exists`,
    `❌ ${name} missing`,
    exists ? undefined : `Expected at: ${path}`
  )
  return exists
}

function checkFileSize(path: string, name: string, maxKB: number) {
  if (!existsSync(path)) return false
  
  const stats = statSync(path)
  const sizeKB = stats.size / 1024
  const pass = sizeKB <= maxKB
  
  check(
    `${name} size`,
    pass,
    `✅ ${name} is ${sizeKB.toFixed(2)} KB (within ${maxKB} KB limit)`,
    `⚠️ ${name} is ${sizeKB.toFixed(2)} KB (exceeds ${maxKB} KB limit)`,
    pass ? undefined : 'File may need re-optimization'
  )
  
  return pass
}

function main() {
  console.log('🔍 Verifying BrokerFi Optimizations...\n')
  
  // Check optimized JSON files
  const dataDir = join(process.cwd(), 'public', 'data')
  checkFileExists(join(dataDir, 'assets-index.json'), 'Optimized Index')
  checkFileExists(join(dataDir, 'assets-crypto.json'), 'Crypto Assets')
  checkFileExists(join(dataDir, 'assets-stocks.json'), 'Stock Assets')
  checkFileExists(join(dataDir, 'assets-forex.json'), 'Forex Assets')
  checkFileExists(join(dataDir, 'assets-commodities.json'), 'Commodity Assets')
  
  // Check file sizes
  checkFileSize(join(dataDir, 'assets-index.json'), 'Optimized Index', 100)
  checkFileSize(join(dataDir, 'assets-crypto.json'), 'Crypto Assets', 10)
  checkFileSize(join(dataDir, 'assets-stocks.json'), 'Stock Assets', 80)
  
  // Check sprite files
  const spriteDir = join(process.cwd(), 'public', 'sprites')
  checkFileExists(join(spriteDir, 'crypto.webp'), 'Crypto Sprite')
  checkFileExists(join(spriteDir, 'crypto.json'), 'Crypto Sprite Map')
  checkFileExists(join(spriteDir, 'stock.webp'), 'Stock Sprite')
  checkFileExists(join(spriteDir, 'stock.json'), 'Stock Sprite Map')
  checkFileExists(join(spriteDir, 'index.json'), 'Sprite Index')
  
  // Check sprite sizes
  checkFileSize(join(spriteDir, 'crypto.webp'), 'Crypto Sprite', 15)
  checkFileSize(join(spriteDir, 'stock.webp'), 'Stock Sprite', 100)
  
  // Verify JSON structure
  try {
    const indexPath = join(dataDir, 'assets-index.json')
    if (existsSync(indexPath)) {
      const indexData = JSON.parse(readFileSync(indexPath, 'utf-8'))
      
      const hasAllKeys = 'c' in indexData && 's' in indexData && 'f' in indexData && 'x' in indexData && 'v' in indexData
      check(
        'Index structure',
        hasAllKeys,
        '✅ Index has all required keys (c, s, f, x, v)',
        '❌ Index missing required keys'
      )
      
      const totalAssets = (indexData.c?.length || 0) + (indexData.s?.length || 0) + (indexData.f?.length || 0) + (indexData.x?.length || 0)
      check(
        'Asset count',
        totalAssets > 500,
        `✅ Index contains ${totalAssets} assets`,
        `⚠️ Index only contains ${totalAssets} assets (expected 500+)`
      )
      
      // Check compression ratio
      const rawSize = readFileSync(indexPath).length
      const gzippedSize = gzipSync(readFileSync(indexPath)).length
      const compressionRatio = ((1 - gzippedSize / rawSize) * 100).toFixed(1)
      
      check(
        'Compression',
        gzippedSize < rawSize * 0.4,
        `✅ Gzip compression: ${compressionRatio}% (${(gzippedSize / 1024).toFixed(2)} KB gzipped)`,
        `⚠️ Poor compression: ${compressionRatio}%`
      )
    }
  } catch (error) {
    check('Index validation', false, '', `❌ Failed to parse index: ${(error as Error).message}`)
  }
  
  // Verify sprite structure
  try {
    const cryptoMapPath = join(spriteDir, 'crypto.json')
    if (existsSync(cryptoMapPath)) {
      const cryptoMap = JSON.parse(readFileSync(cryptoMapPath, 'utf-8'))
      
      const hasPositions = 'positions' in cryptoMap && typeof cryptoMap.positions === 'object'
      check(
        'Sprite map structure',
        hasPositions,
        `✅ Sprite map has ${Object.keys(cryptoMap.positions || {}).length} icon positions`,
        '❌ Sprite map missing positions'
      )
    }
  } catch (error) {
    check('Sprite validation', false, '', `❌ Failed to parse sprite map: ${(error as Error).message}`)
  }
  
  // Print results
  console.log('\n' + '='.repeat(60))
  console.log('VERIFICATION RESULTS')
  console.log('='.repeat(60) + '\n')
  
  const passed = results.filter(r => r.status === 'pass').length
  const failed = results.filter(r => r.status === 'fail').length
  const warned = results.filter(r => r.status === 'warn').length
  
  for (const result of results) {
    console.log(result.message)
    if (result.details) {
      console.log(`  ${result.details}`)
    }
  }
  
  console.log('\n' + '='.repeat(60))
  console.log(`SUMMARY: ${passed} passed, ${failed} failed, ${warned} warnings`)
  console.log('='.repeat(60))
  
  if (failed > 0) {
    console.log('\n❌ Verification failed. Run optimizations:')
    console.log('   npm run optimize')
    process.exit(1)
  } else if (warned > 0) {
    console.log('\n⚠️  Verification passed with warnings.')
    console.log('   Consider re-running: npm run optimize')
  } else {
    console.log('\n✅ All optimizations verified successfully!')
    console.log('   Ready for production deployment! 🚀')
  }
}

main()
