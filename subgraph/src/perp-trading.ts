import { BigInt } from "@graphprotocol/graph-ts"
import {
  PositionOpened,
  PositionClosed,
  PositionLiquidated,
  StopLossExecuted,
  TakeProfitExecuted,
  PerpetualTrading as PerpetualTradingContract
} from "../generated/templates/PerpetualTrading/PerpetualTrading"
import { User } from "../generated/schema"

export function handlePositionOpened(event: PositionOpened): void {
  // Load or create user
  let user = User.load(event.params.trader)
  if (!user) {
    user = new User(event.params.trader)
    user.totalOrders = BigInt.fromI32(0)
    user.activeOrders = BigInt.fromI32(0)
    user.executedOrders = BigInt.fromI32(0)
    user.cancelledOrders = BigInt.fromI32(0)
    user.totalVolumeUsd = BigInt.fromI32(0)
    user.totalPerpVolumeUsd = BigInt.fromI32(0)
    user.totalOptionsVolumeUsd = BigInt.fromI32(0)
    user.lastTradeTimestamp = BigInt.fromI32(0)
  }
  
  // Track volume from position opening
  // Calculate sizeUsd = size * entryPrice / 1e18
  let sizeUsd = event.params.size.times(event.params.entryPrice).div(BigInt.fromI32(10).pow(18))
  
  user.totalVolumeUsd = user.totalVolumeUsd.plus(sizeUsd)
  user.totalPerpVolumeUsd = user.totalPerpVolumeUsd.plus(sizeUsd)
  user.executedOrders = user.executedOrders.plus(BigInt.fromI32(1))
  user.lastTradeTimestamp = event.block.timestamp
  user.save()
}

export function handlePositionClosed(event: PositionClosed): void {
  // Update last trade timestamp when position is closed
  let user = User.load(event.params.trader)
  if (user) {
    user.lastTradeTimestamp = event.block.timestamp
    user.save()
  }
}

export function handlePositionLiquidated(event: PositionLiquidated): void {
  // Update last trade timestamp when position is liquidated
  let user = User.load(event.params.trader)
  if (user) {
    user.lastTradeTimestamp = event.block.timestamp
    user.save()
  }
}

export function handleStopLossExecuted(event: StopLossExecuted): void {
  // Update last trade timestamp when SL is executed
  let user = User.load(event.params.trader)
  if (user) {
    user.lastTradeTimestamp = event.block.timestamp
    user.save()
  }
}

export function handleTakeProfitExecuted(event: TakeProfitExecuted): void {
  // Update last trade timestamp when TP is executed
  let user = User.load(event.params.trader)
  if (user) {
    user.lastTradeTimestamp = event.block.timestamp
    user.save()
  }
}
