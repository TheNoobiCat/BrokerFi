

import { useState, useEffect } from 'react'

const SUBGRAPH_URL = 'YOUR_GOLDSKY_URL_HERE'

interface LimitOrder {
  id: string
  orderId: string
  market: {
    id: string
    marketName: string
  }
  collateral: string
  size: string
  isLong: boolean
  triggerPrice: string
  attachedStopLoss: string
  attachedTakeProfit: string
  expiryTime: string
  createdTime: string
}

export function useUserLimitOrders(userAddress: string | undefined) {
  const [orders, setOrders] = useState<LimitOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userAddress) {
      setOrders([])
      setLoading(false)
      return
    }

    async function fetchOrders() {
      setLoading(true)
      setError(null)
      
      try {
        const query = `{
          limitOrders(
            where: { 
              trader: "${userAddress.toLowerCase()}"
              status: ACTIVE
            }
            orderBy: createdTime
            orderDirection: desc
          ) {
            id
            orderId
            market {
              id
              marketName
            }
            collateral
            size
            isLong
            triggerPrice
            attachedStopLoss
            attachedTakeProfit
            expiryTime
            createdTime
          }
        }`

        const response = await fetch(SUBGRAPH_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query })
        })

        if (!response.ok) {
          throw new Error('Subgraph query failed')
        }

        const { data, errors } = await response.json()
        
        if (errors) {
          throw new Error(errors[0].message)
        }

        setOrders(data.limitOrders)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [userAddress])

  return { orders, loading, error }
}

export function useMarkets() {
  const [markets, setMarkets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchMarkets() {
      try {
        const query = `{
          markets(orderBy: createdAt, orderDirection: desc) {
            id
            marketName
            pool
            trading
            totalOrders
            activeOrders
            executedOrders
            cancelledOrders
          }
        }`

        const response = await fetch(SUBGRAPH_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query })
        })

        const { data } = await response.json()
        setMarkets(data.markets)
      } catch (err) {
        console.error('Failed to fetch markets:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchMarkets()
  }, [])

  return { markets, loading }
}

// Usage example:
// const { orders, loading } = useUserLimitOrders(address)
