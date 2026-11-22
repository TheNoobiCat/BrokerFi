'use client'

import React, { useEffect, useState, memo, useMemo } from 'react'

interface IconProps {
  symbol: string
  name?: string
  type?: 'crypto' | 'stock' | 'forex' | 'default'
  size?: number
  className?: string
  alt?: string
}

interface SpritePosition {
  x: number
  y: number
  w: number
  h: number
}

interface SpriteMap {
  positions: Record<string, SpritePosition>
  iconSize: number
  count: number
  sprite: string
}

// Global cache for sprite maps
const spriteCache: Record<string, SpriteMap | null> = {}
const spriteCachePromises: Partial<Record<string, Promise<SpriteMap | null>>> = {}

// Preload sprite maps on mount
if (typeof window !== 'undefined') {
  ;['crypto', 'stock'].forEach(type => {
    if (!spriteCachePromises[type]) {
      spriteCachePromises[type] = fetch(`/sprites/${type}.json`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          spriteCache[type] = data
          return data
        })
        .catch(() => {
          spriteCache[type] = null
          return null
        })
    }
  })
}

async function loadSpriteMap(type: string): Promise<SpriteMap | null> {
  if (spriteCache[type] !== undefined) return spriteCache[type]
  if (spriteCachePromises[type]) return spriteCachePromises[type]
  
  spriteCachePromises[type] = fetch(`/sprites/${type}.json`)
    .then(res => res.ok ? res.json() : null)
    .then(data => {
      spriteCache[type] = data
      return data
    })
    .catch(() => {
      spriteCache[type] = null
      return null
    })
  
  return spriteCachePromises[type]
}

function Icon({ symbol, name, type = 'crypto', size = 20, className = '', alt }: IconProps) {
  const [spriteMap, setSpriteMap] = useState<SpriteMap | null>(spriteCache[type] || null)
  const [useFallback, setUseFallback] = useState(false)

  // Extract clean symbol name
  const cleanSymbol = useMemo(() => {
    const raw = String(symbol || '')
    const parts = raw.split('-').map(p => p.toLowerCase())
    const last = parts[parts.length - 1]
    // Remove prefix and clean
    return last.replace(/[^a-z0-9]/gi, '_')
  }, [symbol])

  // Load sprite map if not cached
  useEffect(() => {
    // Only load if we don't have a sprite map yet
    if (spriteMap || useFallback) return
    if (type !== 'crypto' && type !== 'stock') return
    
    loadSpriteMap(type).then(map => {
      if (map) {
        setSpriteMap(map)
      } else {
        setUseFallback(true)
      }
    })
  }, [type]) // Only depend on type to avoid infinite loops

  // Try to get position from sprite map
  const position = useMemo(() => {
    if (!spriteMap) return null
    
    // Try multiple symbol variants
    const variants = [
      cleanSymbol,
      cleanSymbol.toLowerCase(),
      cleanSymbol.toUpperCase(),
    ]
    
    for (const variant of variants) {
      if (spriteMap.positions[variant]) {
        return spriteMap.positions[variant]
      }
    }
    
    return null
  }, [spriteMap, cleanSymbol])

  const sizePx = `${size}px`
  const ICONS_PER_ROW = 20
  const spriteIconSize = spriteMap?.iconSize || 20
  const scale = size / spriteIconSize // scale relative to actual sprite icon size

  // If we have a sprite position, use it
  if (position && spriteMap && !useFallback) {
    return (
      <div
        className={className}
        style={{
          width: sizePx,
          height: sizePx,
          backgroundImage: `url(/sprites/${spriteMap.sprite})`,
          backgroundPosition: `${position.x * scale}px ${position.y * scale}px`,
          // Background size: ensure sprite scales so each icon occupies `size` px
          backgroundSize: `${ICONS_PER_ROW * size}px auto`,
          backgroundRepeat: 'no-repeat',
          borderRadius: 8,
          backgroundColor: '#ffffff'
        }}
        aria-label={alt || symbol}
        title={alt || name || symbol}
      />
    )
  }

  // Fallback: Try loading individual icon files (legacy mode)
  if (useFallback || type === 'forex' || type === 'default') {
    return <LegacyIcon 
      symbol={symbol} 
      name={name} 
      type={type} 
      size={size} 
      className={className} 
      alt={alt} 
    />
  }

  // Loading state or fallback placeholder
  return (
    <div 
      className={className} 
      style={{ 
        width: sizePx, 
        height: sizePx, 
        borderRadius: 8, 
        background: '#1f2937' 
      }} 
      aria-label={alt || symbol}
    />
  )
}

// Legacy fallback component for non-sprite icons
function LegacyIcon({ symbol, name, type = 'crypto', size = 20, className = '', alt }: IconProps) {
  const raw = String(symbol || '')
  const parts = raw.split('-').map(p => p.toLowerCase())
  const last = parts[parts.length - 1]
  const baseCandidates = Array.from(new Set([last, raw.toLowerCase()]))

  const makeSafe = (s: string) => String(s).toLowerCase().replace(/[^a-z0-9]/gi, '_')

  const candidates: string[] = []
  for (const cand of baseCandidates) {
    const safe = makeSafe(cand)
    candidates.push(`/icons/${type}_${safe}.png`)
    candidates.push(`/icons/${type}_${safe}.svg`)
    candidates.push(`/icons/${type}-${safe}.png`)
    candidates.push(`/icons/${type}-${safe}.svg`)
    candidates.push(`/icons/${safe}.png`)
    candidates.push(`/icons/${safe}.svg`)
  }

  ;(global as any).__loadedIconUrls = (global as any).__loadedIconUrls || new Set<string>()
  const loadedUrls: Set<string> = (global as any).__loadedIconUrls

  const findCachedIndex = () => {
    for (let i = 0; i < candidates.length; i++) {
      if (loadedUrls.has(candidates[i])) return i
    }
    return 0
  }

  const [index, setIndex] = useState<number>(findCachedIndex)
  const [failed, setFailed] = useState(false)

  const handleError = () => {
    setIndex((prev) => {
      const next = prev + 1
      if (next >= candidates.length) {
        setFailed(true)
        return prev
      }
      return next
    })
  }

  const handleLoad = (urlLoaded: string) => {
    loadedUrls.add(urlLoaded)
    setFailed(false)
  }

  const sizePx = `${size}px`
  const currentSrc = !failed && index < candidates.length ? candidates[index] : null
  
  if (currentSrc) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={currentSrc}
        width={size}
        height={size}
        alt={alt || symbol}
        className={className}
        style={{ width: sizePx, height: sizePx, borderRadius: 8, backgroundColor: '#ffffff' }}
        onLoad={() => handleLoad(currentSrc)}
        onError={handleError}
      />
    )
  }

  return (
    <div 
      className={className} 
      style={{ 
        width: sizePx, 
        height: sizePx, 
        borderRadius: 8, 
        background: '#111827' 
      }} 
      aria-label={alt || symbol} 
    />
  )
}

export default memo(Icon)
