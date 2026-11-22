import React from 'react';

export interface VirtualizedListProps<T> {
  items: T[]
  // Optional height in pixels. If omitted, component will use container height.
  height?: number
  itemHeight: number
  renderItem: (item: T, index: number) => React.ReactNode
  className?: string
  buffer?: number // Number of extra items to render outside visible area
}

export function VirtualizedList<T>({ 
  items, 
  height, 
  itemHeight, 
  renderItem, 
  className = '',
  buffer = 3 // Default buffer of 3 items above and below
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = React.useState(0)
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Auto-adjust height to container
  const [containerHeight, setContainerHeight] = React.useState<number | undefined>(height)

  // Memoize calculations (use containerHeight which is now declared)
  const calculations = React.useMemo(() => {
    const effectiveHeight = typeof height === 'number' ? height : (containerHeight ?? 0)
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer)
    const endIndex = Math.min(
      startIndex + (effectiveHeight > 0 ? Math.ceil(effectiveHeight / itemHeight) : 0) + (buffer * 2),
      items.length
    )

    const visibleItems = items.slice(startIndex, endIndex)
    const totalHeight = items.length * itemHeight
    const offsetY = startIndex * itemHeight

    return { startIndex, endIndex, visibleItems, totalHeight, offsetY }
  }, [items, height, containerHeight, itemHeight, scrollTop, buffer])
  
  // Throttled scroll handler for better performance (guard against null)
  const timeoutRef = React.useRef<number | null>(null)
  const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (timeoutRef.current != null) window.clearTimeout(timeoutRef.current)
    timeoutRef.current = window.setTimeout(() => {
      // Prefer the containerRef (more robust). Fall back to event currentTarget.
      const el = containerRef.current ?? (e.currentTarget as unknown as HTMLDivElement | null)
      const top = el?.scrollTop ?? 0
      setScrollTop(top)
    }, 10)
  }, [])
  
  React.useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setContainerHeight(rect.height)
      }
    }
    
    updateHeight()
    window.addEventListener('resize', updateHeight)
    
    return () => {
      window.removeEventListener('resize', updateHeight)
      if (timeoutRef.current != null) window.clearTimeout(timeoutRef.current)
    }
  }, [])
  
  return (
    <div 
      ref={containerRef}
      className={`relative overflow-auto ${className}`}
      // If a numeric height is provided, use it; otherwise allow CSS to size the container.
      style={typeof height === 'number' ? { height } : undefined}
      onScroll={handleScroll}
    >
      <div style={{ height: calculations.totalHeight }}>
        <div style={{ transform: `translateY(${calculations.offsetY}px)` }}>
          {calculations.visibleItems.map((item, index) => (
            <div 
              key={calculations.startIndex + index} 
              style={{ height: itemHeight }}
              className="w-full"
            >
              {renderItem(item, calculations.startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}