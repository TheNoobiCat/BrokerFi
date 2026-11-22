import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

// Cache the JSON data in memory to avoid repeated file reads
let assetsCache: any = null
let lastMtimeMs: number | null = null

export async function GET() {
  try {
    const filePath = join(process.cwd(), 'scripts', 'assetslister', 'pyth_feeds_organized.json')

    // In development, always re-read the file so editors/dev scripts can regenerate it
    // without requiring a server restart. In production, keep the file cached for
    // performance.
    const isDev = process.env.NODE_ENV !== 'production'

    if (!isDev && assetsCache) {
      return NextResponse.json(assetsCache, {
        headers: {
          'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
          'CDN-Cache-Control': 'public, max-age=86400',
          'Vercel-CDN-Cache-Control': 'public, max-age=86400',
        }
      })
    }

    // Read file and parse
    const fileContent = readFileSync(filePath, 'utf-8')
    const data = JSON.parse(fileContent)

    // Update cache in production or for subsequent reads
    if (!isDev) {
      assetsCache = data
    }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': isDev 
          ? 'no-cache, no-store, must-revalidate' 
          : 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
        'CDN-Cache-Control': 'public, max-age=86400',
        'Vercel-CDN-Cache-Control': 'public, max-age=86400',
      }
    })
  } catch (error) {
    // Log the error for server-side debugging
    console.error('Error in GET /api/assets:', error)

    // Include the error message in development responses to aid debugging
    const isDev = process.env.NODE_ENV !== 'production'
    const payload: any = { error: 'Failed to load assets data' }
    if (isDev) payload.message = (error as any)?.message || String(error)

    return NextResponse.json(payload, { status: 500 })
  }
}