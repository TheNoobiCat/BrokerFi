#!/usr/bin/env node
/**
 * Unified Sprite Generator for BrokerFi
 * 
 * Consolidates sprite generation for all asset types:
 * - Crypto: Downloads from cryptofonts and generates sprite
 * - Stocks/Forex/Commodities: Uses existing local icons
 * 
 * Usage: npm run optimize:sprites
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import { existsSync } from 'fs'
import { join } from 'path'

const execAsync = promisify(exec)

async function main() {
  console.log('🎨 Starting unified sprite generation...\n')
  
  // Check if Python is available
  try {
    await execAsync('python --version')
  } catch (error) {
    console.error('❌ Python is not installed or not in PATH')
    console.error('Please install Python 3 to generate sprites')
    process.exit(1)
  }
  
  // Generate crypto sprites (downloads icons if needed)
  console.log('📥 Generating crypto sprites...')
  try {
    const { stdout, stderr } = await execAsync('python scripts/generate-crypto-sprite.py')
    console.log(stdout)
    if (stderr) console.error(stderr)
  } catch (error: any) {
    console.error('❌ Failed to generate crypto sprites:', error.message)
  }
  
  // Generate other sprites from existing icons
  console.log('\n📦 Generating stock/forex/commodity sprites...')
  try {
    const { stdout, stderr } = await execAsync('python scripts/generate-sprites.py')
    console.log(stdout)
    if (stderr) console.error(stderr)
  } catch (error: any) {
    console.error('❌ Failed to generate other sprites:', error.message)
  }
  
  console.log('\n✨ Sprite generation complete!\n')
  
  // Verify outputs
  const spritePath = join(process.cwd(), 'public', 'sprites')
  const expectedSprites = ['crypto.webp', 'crypto.json', 'stock.webp', 'stock.json']
  
  let allExist = true
  for (const file of expectedSprites) {
    const path = join(spritePath, file)
    if (existsSync(path)) {
      console.log(`✅ ${file}`)
    } else {
      console.log(`⚠️  ${file} (missing)`)
      allExist = false
    }
  }
  
  if (allExist) {
    console.log('\n🎉 All sprites generated successfully!')
  } else {
    console.log('\n⚠️  Some sprites are missing. Check the errors above.')
  }
}

main().catch(console.error)
