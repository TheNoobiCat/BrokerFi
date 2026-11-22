# BrokerFi Subgraph

This subgraph indexes both perpetual futures and options trading data from the BrokerFi protocol.

## Setup Instructions

### 1. Get your ABIs

You need to extract the ABI JSON arrays from your compiled contracts:

**Perpetual Factory ABI:**
```bash
# From your hardhat/foundry artifacts
cp artifacts/contracts/Factory.sol/PerpetualFactory.json abis/Factory.json
```

**LimitOrderBook ABI:**
```bash
cp artifacts/contracts/LimitOrderBook.sol/LimitOrderBook.json abis/LimitOrderBook.json
```

**Options Orderbook ABI:**
```bash
# Extract from compiled Orderbook.sol
jq -r '.abi' out/Orderbook.sol/Orderbook.json > abis/OptionsOrderbook.json
```

**IMPORTANT:** The ABI files should contain JUST the ABI array, not the full artifact.
If you have the full Hardhat artifact, extract just the `abi` field:
```bash
jq '.abi' artifacts/contracts/Factory.sol/PerpetualFactory.json > abis/Factory.json
jq '.abi' artifacts/contracts/LimitOrderBook.sol/LimitOrderBook.json > abis/LimitOrderBook.json
jq '.abi' out/Orderbook.sol/Orderbook.json > abis/OptionsOrderbook.json
```

### 2. Update subgraph.yaml

Edit `subgraph.yaml` and change:
- `address: "YOUR_FACTORY_ADDRESS_HERE"` - Put your deployed factory address
- `startBlock: 0` - Put your factory deploy block number (makes it faster)
- `network: arbitrum-sepolia` - Change if you're on a different network

### 3. Install dependencies

```bash
npm install
```

### 4. Generate code

```bash
npm run codegen
```

### 5. Build

```bash
npm run build
```

### 6. Deploy to Goldsky

```bash
# Login first
goldsky login

# Deploy
npm run deploy
```

Goldsky will give you a GraphQL endpoint URL like:
`https://api.goldsky.com/api/public/project_XXX/subgraphs/brokerfi/v1.0.0/gn`

---

## Frontend Queries

### Get user's active orders across all markets

```javascript
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

const res = await fetch(GOLDSKY_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query })
})

const { data } = await res.json()
return data.limitOrders
```

### Get all markets

```javascript
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
```

### Get orders for a specific market

```javascript
const query = `{
  market(id: "${marketAddress.toLowerCase()}") {
    marketName
    activeOrders
    orders(
      where: { status: ACTIVE }
      orderBy: triggerPrice
      orderDirection: asc
    ) {
      id
      trader {
        id
      }
      size
      triggerPrice
      isLong
    }
  }
}`
```

### Get user stats

```javascript
const query = `{
  user(id: "${userAddress.toLowerCase()}") {
    totalOrders
    activeOrders
    executedOrders
    cancelledOrders
    orders(
      first: 10
      orderBy: createdTime
      orderDirection: desc
    ) {
      id
      market {
        marketName
      }
      status
      triggerPrice
      createdTime
    }
  }
}`
```

---

## Troubleshooting

**"Cannot find module"** - Run `npm run codegen` first

**"Failed to call"** - Check your ABI files are correct JSON arrays

**"No matching event"** - Make sure event signatures in subgraph.yaml match your actual contract events

**Slow indexing** - Update `startBlock` in subgraph.yaml to your factory deploy block

---

## Optional: Improve Event Data

Right now the subgraph calls `getLimitOrder()` on-chain for each order creation to get collateral/size/isLong.
This is slow but works.

To make it faster, update your LimitOrderBook event to emit all fields:

```solidity
event LimitOrderCreated(
    bytes32 indexed orderId,
    address indexed trader,
    uint256 collateral,      // ADD
    uint256 size,            // ADD
    bool isLong,             // ADD
    uint256 triggerPrice,
    uint256 attachedStopLoss,
    uint256 attachedTakeProfit,
    uint256 expiryTime       // ADD
);
```

Then update `src/orderbook.ts` to use event params instead of contract calls:
```typescript
order.collateral = event.params.collateral
order.size = event.params.size
order.isLong = event.params.isLong
order.expiryTime = event.params.expiryTime
```

This will make indexing 100x faster.
