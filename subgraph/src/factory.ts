import { BigInt, Bytes } from "@graphprotocol/graph-ts"
import { MarketCreated } from "../generated/PerpetualFactory/PerpetualFactory"
import { LimitOrderBook } from "../generated/templates"
import { PerpetualTrading } from "../generated/PerpetualFactory/PerpetualTrading"
import { Market } from "../generated/schema"

export function handleMarketCreated(event: MarketCreated): void {
  // Create Market entity using limitOrderBook address as ID
  let market = new Market(event.params.limitOrderBook)
  
  // marketName is an indexed string, so we only get the keccak256 hash.
  // Just store the hash hex - the frontend will resolve names via pythPriceId.
  market.marketName = event.params.marketName.toHexString()
  
  market.pool = event.params.pool
  market.trading = event.params.trading
  
  // Call perpTrading.priceFeedId() to get the Pyth feed ID
  let tradingContract = PerpetualTrading.bind(event.params.trading)
  let feedIdResult = tradingContract.try_priceFeedId()
  if (!feedIdResult.reverted) {
    market.pythPriceId = feedIdResult.value
  }
  
  market.createdAt = event.block.timestamp
  market.createdAtBlock = event.block.number
  market.totalOrders = BigInt.fromI32(0)
  market.activeOrders = BigInt.fromI32(0)
  market.executedOrders = BigInt.fromI32(0)
  market.cancelledOrders = BigInt.fromI32(0)
  
  market.save()
  
  // Start indexing this LimitOrderBook instance
  LimitOrderBook.create(event.params.limitOrderBook)
}
