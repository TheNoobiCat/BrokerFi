import { BigInt } from "@graphprotocol/graph-ts"
import {
  LimitOrderCreated,
  LimitOrderCancelled,
  OptionsOrderbook as OrderbookContract
} from "../generated/OptionsOrderbook/OptionsOrderbook"
import { OptionsOrder, OptionsSeries, User } from "../generated/schema"

export function handleOptionsLimitOrderCreated(event: LimitOrderCreated): void {
  let seriesId = event.params.seriesId

  // Load or create series
  let series = OptionsSeries.load(seriesId)
  if (!series) {
    // Get series data from contract
    let contract = OrderbookContract.bind(event.address)
    let seriesData = contract.try_getSeries(seriesId)
    if (seriesData.reverted) {
      return // Series not found
    }
    series = new OptionsSeries(seriesId)
    series.underlyingPriceFeedId = seriesData.value.getUnderlyingPriceFeedId()
    series.isCall = seriesData.value.getIsCall()
    series.strikePrice = seriesData.value.getStrikePrice()
    series.expiry = seriesData.value.getExpiry()
    series.contractSize = seriesData.value.getContractSize()
    series.createdAt = event.block.timestamp
    series.createdAtBlock = event.block.number
    series.save()
  }

  // Get order data from contract
  let contract = OrderbookContract.bind(event.address)
  let orderData = contract.try_orders(seriesId, event.params.orderId)
  if (orderData.reverted) {
    return // Order not found
  }

  // Load or create user
  let user = User.load(orderData.value.getTrader())
  if (!user) {
    user = new User(orderData.value.getTrader())
    user.totalOrders = BigInt.fromI32(0)
    user.activeOrders = BigInt.fromI32(0)
    user.executedOrders = BigInt.fromI32(0)
    user.cancelledOrders = BigInt.fromI32(0)
  }

  // Create unique order ID: seriesId + orderId
  let orderId = seriesId.toHex() + "-" + event.params.orderId.toHex()
  let order = new OptionsOrder(orderId)

  order.orderId = event.params.orderId
  order.series = seriesId
  order.trader = orderData.value.getTrader()
  order.isLong = orderData.value.getIsLong()
  order.limitPrice = orderData.value.getLimitPrice()
  order.quantity = orderData.value.getQuantity()
  order.marginLocked = orderData.value.getMarginLocked()
  order.intent = orderIntentToString(orderData.value.getIntent())
  order.isLiquidation = orderData.value.getIsLiquidation()
  order.status = "ACTIVE"
  order.createdTime = event.block.timestamp
  order.createdAtBlock = event.block.number

  // Update user stats
  user.totalOrders = user.totalOrders.plus(BigInt.fromI32(1))
  user.activeOrders = user.activeOrders.plus(BigInt.fromI32(1))

  order.save()
  user.save()
}

export function handleOptionsLimitOrderCancelled(event: LimitOrderCancelled): void {
  let seriesId = event.params.seriesId
  let orderId = seriesId.toHex() + "-" + event.params.orderId.toHex()

  // Load the order
  let order = OptionsOrder.load(orderId)
  if (!order) {
    return // Order not found
  }

  // Update order status
  order.status = "CANCELLED"
  order.cancelledAt = event.block.timestamp
  order.cancelledAtBlock = event.block.number

  // Load user and update stats
  let user = User.load(order.trader)
  if (user) {
    user.activeOrders = user.activeOrders.minus(BigInt.fromI32(1))
    user.cancelledOrders = user.cancelledOrders.plus(BigInt.fromI32(1))
    user.save()
  }

  order.save()
}

function orderIntentToString(intent: i32): string {
  if (intent == 0) return "BuyToOpen"
  if (intent == 1) return "BuyToClose"
  if (intent == 2) return "SellToOpen"
  if (intent == 3) return "SellToClose"
  return "Unknown"
}