'use client'

import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'brokerfi-favorites'

/**
 * Hook for managing user's favorite assets with localStorage persistence
 * Returns favorites set, toggle function, and check function
 */
export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [isHydrated, setIsHydrated] = useState(false)

  // Load favorites from localStorage on mount
  useEffect(() => {
    try {
      // Support migration from legacy keys/formats
      const legacyKeys = ['brokerfi_favorites', 'brokerfi-favs', 'favorites', STORAGE_KEY]
      let parsed: string[] | null = null
      for (const key of legacyKeys) {
        const raw = localStorage.getItem(key)
        if (!raw) continue
        try {
          const candidate = JSON.parse(raw)
          if (Array.isArray(candidate) && candidate.length > 0) {
            parsed = candidate
            break
          }
        } catch {
          // not JSON, try to treat as comma-separated list
          if (typeof raw === 'string' && raw.includes(',')) {
            parsed = raw.split(',').map(s => s.trim()).filter(Boolean)
            break
          }
        }
      }
      if (parsed) {
        // Normalize values to urlSlug-like format where possible
        const normalize = (val: string) => {
          if (!val) return val
          const v = String(val).trim()
          if (v.includes('-')) return v.toLowerCase()
          if (v.includes('/')) {
            // forex display like EUR/USD -> forex-eur
            const base = v.split('/')[0].toLowerCase()
            return `forex-${base}`
          }
          const up = v.toUpperCase()
          if (up.endsWith('USD') && up.length > 3) {
            const base = up.slice(0, -3).toLowerCase()
            return `crypto-${base}`
          }
          // Short alpha codes likely stocks
          if (/^[A-Z0-9]{1,5}$/.test(up)) return `stock-${up.toLowerCase()}`
          // Fallback: lowercase cleaned
          return v.toLowerCase().replace(/[^a-z0-9]/g, '')
        }

        const normalized = parsed.map(normalize)
        setFavorites(new Set(normalized))
        setIsHydrated(true)
      } else {
        // No explicit legacy favorites found; attempt to load default favorites from popular assets (p: 1)
        (async () => {
          try {
            const resp = await fetch('/data/assets-index.json')
            if (resp.ok) {
              const index = await resp.json()
              const items: any[] = []
              if (Array.isArray(index.c)) items.push(...index.c.map((o: any) => ({ ...o, t: 'c' })))
              if (Array.isArray(index.s)) items.push(...index.s.map((o: any) => ({ ...o, t: 's' })))
              if (Array.isArray(index.f)) items.push(...index.f.map((o: any) => ({ ...o, t: 'f' })))
              if (Array.isArray(index.x)) items.push(...index.x.map((o: any) => ({ ...o, t: 'x' })))

              const typeToPrefix: Record<string, string> = { c: 'crypto', s: 'stock', f: 'forex', x: 'commodity' }
              const slugs: string[] = []
              for (const opt of items) {
                // Seed favorites from popular assets (p: 1)
                if (opt.p !== 1) continue
                const prefix = typeToPrefix[opt.t] || 'asset'
                if (opt.t === 'f' && opt.d && typeof opt.d === 'string' && opt.d.includes('/')) {
                  const base = opt.d.split('/')[0].toLowerCase()
                  slugs.push(`${prefix}-${base}`)
                } else {
                  const clean = String(opt.s || '').toLowerCase().replace(/[^a-z0-9]/g, '')
                  if (clean) slugs.push(`${prefix}-${clean}`)
                }
              }

              if (slugs.length > 0) {
                console.log('[useFavorites] Seeding popular assets as favorites:', slugs)
                setFavorites(new Set(slugs))
              } else {
                console.warn('[useFavorites] No popular assets found to seed')
              }
            } else {
              console.error('[useFavorites] Failed to fetch assets-index.json:', resp.status, resp.statusText)
            }
          } catch (e) {
            console.error('[useFavorites] Error loading default favorites:', e)
          } finally {
            setIsHydrated(true)
          }
        })()
      }
    } catch (error) {
      console.error('Failed to load favorites:', error)
      setIsHydrated(true)
    }
  }, [])

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    if (!isHydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(favorites)))
    } catch (error) {
      console.error('Failed to save favorites:', error)
    }
  }, [favorites, isHydrated])

  const toggleFavorite = useCallback((assetId: string) => {
    setFavorites(prev => {
      const next = new Set(prev)
      if (next.has(assetId)) {
        next.delete(assetId)
      } else {
        next.add(assetId)
      }
      return next
    })
  }, [])

  const isFavorite = useCallback((assetId: string) => {
    return favorites.has(assetId)
  }, [favorites])

  return {
    favorites,
    toggleFavorite,
    isFavorite,
    isHydrated
  }
}
