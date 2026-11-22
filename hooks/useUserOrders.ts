import { useState, useEffect, useCallback } from 'react'

// Hook to fetch perpetual futures limit orders from the subgraph
export function useUserOrders(address: string | undefined) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const refresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1)
  }, [])

  useEffect(() => {
    if (!address) return

    async function fetchOrders() {
      if (!address) return;
      const query = `{
        limitOrders(
          where: { 
            trader: "${address.toLowerCase()}"
            status: ACTIVE
          }
        ) {
          id
          orderId
          collateral
          size
          isLong
          triggerPrice
          market { id pythPriceId }
        }
      }`

      const url = process.env.NEXT_PUBLIC_GOLDSKY_URL;
      if (!url) return;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      })

      const json = await res.json()
      const limitOrders = json?.data?.limitOrders
      setOrders(limitOrders || [])
      setLoading(false)
    }

    fetchOrders().catch(() => {
      setOrders([])
      setLoading(false)
    })
  }, [address, refreshTrigger])

  return { orders, loading, refresh }
}