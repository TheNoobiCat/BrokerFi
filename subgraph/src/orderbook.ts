import { BigInt } from "@graphprotocol/graph-ts"
import {
  LimitOrderCreated,
  LimitOrderExecuted,
  LimitOrderCancelled,
  LimitOrderBook as LimitOrderBookContract
} from "../generated/templates/LimitOrderBook/LimitOrderBook"
import { PerpetualTrading } from "../generated/templates/LimitOrderBook/PerpetualTrading"
import { LimitOrder, Market, User } from "../generated/schema"

export function handleLimitOrderCreated(event: LimitOrderCreated): void {
  // Load or create market entity. Normally created by factory.ts handleMarketCreated,
  // but as a safety net we auto-create it if a LimitOrderCreated event arrives first.
  let market = Market.load(event.address)
  if (!market) {
    market = new Market(event.address)
    market.marketName = event.address.toHexString()

    // Read the perpTrading address from the LimitOrderBook contract
    let contract = LimitOrderBookContract.bind(event.address)
    let tradingResult = contract.try_perpTrading()
    if (!tradingResult.reverted) {
      market.trading = tradingResult.value
      
      // Also get pythPriceId from the trading contract
      let tradingContract = PerpetualTrading.bind(tradingResult.value)
      let feedIdResult = tradingContract.try_priceFeedId()
      if (!feedIdResult.reverted) {
        market.pythPriceId = feedIdResult.value
      }
    } else {
      market.trading = event.address
    }
    market.pool = event.address // pool not available from LOB, placeholder

    market.createdAt = event.block.timestamp
    market.createdAtBlock = event.block.number
    market.totalOrders = BigInt.fromI32(0)
    market.activeOrders = BigInt.fromI32(0)
    market.executedOrders = BigInt.fromI32(0)
    market.cancelledOrders = BigInt.fromI32(0)
    market.save()
  }
  
  // Load or create user
  let user = User.load(event.params.trader)
  if (!user) {
    user = new User(event.params.trader)
    user.totalOrders = BigInt.fromI32(0)
    user.activeOrders = BigInt.fromI32(0)
    user.executedOrders = BigInt.fromI32(0)
    user.cancelledOrders = BigInt.fromI32(0)
  }
  
  // Create unique order ID: market_address + orderId
  let orderId = event.address.toHex() + "-" + event.params.orderId.toHex()
  let order = new LimitOrder(orderId)
  
  order.orderId = event.params.orderId
  order.market = event.address
  order.trader = event.params.trader
  order.triggerPrice = event.params.triggerPrice
  order.attachedStopLoss = event.params.attachedStopLoss
  order.attachedTakeProfit = event.params.attachedTakeProfit
  order.status = "ACTIVE"
  order.createdTime = event.block.timestamp
  order.createdAtBlock = event.block.number
  
  // Get additional data by calling the contract
  // (This is slower but your events don't emit collateral/size/isLong)
  let contract = LimitOrderBookContract.bind(event.address)
  let orderData = contract.try_getLimitOrder(event.params.orderId)
  
  if (!orderData.reverted) {
    order.collateral = orderData.value.collateral
    order.size = orderData.value.size
    order.isLong = orderData.value.isLong
    order.expiryTime = orderData.value.expiryTime
  } else {
    // Fallback values if call fails
    order.collateral = BigInt.fromI32(0)
    order.size = BigInt.fromI32(0)
    order.isLong = false
    order.expiryTime = BigInt.fromI32(0)
  }
  
  order.save()
  
  // Update market counters
  market.totalOrders = market.totalOrders.plus(BigInt.fromI32(1))
  market.activeOrders = market.activeOrders.plus(BigInt.fromI32(1))
  market.save()
  
  // Update user counters
  user.totalOrders = user.totalOrders.plus(BigInt.fromI32(1))
  user.activeOrders = user.activeOrders.plus(BigInt.fromI32(1))
  user.save()
}

export function handleLimitOrderExecuted(event: LimitOrderExecuted): void {
  let orderId = event.address.toHex() + "-" + event.params.orderId.toHex()
  let order = LimitOrder.load(orderId)
  
  if (!order) return
  
  order.status = "EXECUTED"
  order.executedAt = event.block.timestamp
  order.executedAtBlock = event.block.number
  order.keeper = event.params.keeper
  // Note: keeperFee is not emitted in the contract event, so we can't track it
  order.save()
  
  // Update market counters
  let market = Market.load(event.address)
  if (market) {
    market.activeOrders = market.activeOrders.minus(BigInt.fromI32(1))
    market.executedOrders = market.executedOrders.plus(BigInt.fromI32(1))
    market.save()
  }
  
  // Update user counters
  let user = User.load(order.trader)
  if (user) {
    user.activeOrders = user.activeOrders.minus(BigInt.fromI32(1))
    user.executedOrders = user.executedOrders.plus(BigInt.fromI32(1))
    user.save()
  }
}

export function handleLimitOrderCancelled(event: LimitOrderCancelled): void {
  let orderId = event.address.toHex() + "-" + event.params.orderId.toHex()
  let order = LimitOrder.load(orderId)
  
  if (!order) return
  
  order.status = "CANCELLED"
  order.cancelledAt = event.block.timestamp
  order.cancelledAtBlock = event.block.number
  order.save()
  
  // Update market counters
  let market = Market.load(event.address)
  if (market) {
    market.activeOrders = market.activeOrders.minus(BigInt.fromI32(1))
    market.cancelledOrders = market.cancelledOrders.plus(BigInt.fromI32(1))
    market.save()
  }
  
  // Update user counters
  let user = User.load(order.trader)
  if (user) {
    user.activeOrders = user.activeOrders.minus(BigInt.fromI32(1))
    user.cancelledOrders = user.cancelledOrders.plus(BigInt.fromI32(1))
    user.save()
  }
}
