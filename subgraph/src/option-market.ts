import { BigInt } from "@graphprotocol/graph-ts";
import { OptionsMarket } from "../generated/schema";
import { MarketCreated } from "../generated/OptionMarket/OptionMarket";

export function handleMarketCreated(event: MarketCreated): void {
  // Get the priceFeedId from the event params
  let priceFeedId = event.params.priceFeedId;

  // Create a new OptionsMarket entity with the priceFeedId as the ID
  let market = new OptionsMarket(priceFeedId.toHexString());

  // Set the basic properties
  market.priceFeedId = priceFeedId;
  market.createdAt = event.block.timestamp;
  market.createdAtBlock = event.block.number;

  // The deployer from the event
  market.deployer = event.params.deployer;

  // Since this is emitted from createMarket, it's always a community market
  market.community = true;

  // Set the contract size from the event
  market.contractSize = event.params.contractSize;

  market.save();
}