import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, getContract, encodeEventTopics } from 'viem';
import { arbitrumSepolia } from 'viem/chains';

// Use Alchemy for Arbitrum Sepolia
const ALCHEMY_KEY = process.env.ALCHEMY_KEY;
const client = createPublicClient({
  chain: arbitrumSepolia,
  transport: http(`https://arb-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`)
});

// Limit Order Book ABI (same as in services/perps.ts)
const limitOrderBookAbi = [
  {
    inputs: [{ internalType: "bytes32", name: "orderId", type: "bytes32" }],
    name: "getLimitOrder",
    outputs: [
      {
        components: [
          { internalType: "address", name: "trader", type: "address" },
          { internalType: "uint256", name: "collateral", type: "uint256" },
          { internalType: "uint256", name: "size", type: "uint256" },
          { internalType: "bool", name: "isLong", type: "bool" },
          { internalType: "uint256", name: "triggerPrice", type: "uint256" },
          { internalType: "uint256", name: "attachedStopLoss", type: "uint256" },
          { internalType: "uint256", name: "attachedTakeProfit", type: "uint256" },
          { internalType: "uint256", name: "expiryTime", type: "uint256" },
          { internalType: "uint256", name: "createdTime", type: "uint256" }
        ],
        internalType: "struct LimitOrderBook.LimitOrder",
        name: "",
        type: "tuple"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes32", name: "orderId", type: "bytes32" },
      { indexed: true, internalType: "address", name: "trader", type: "address" },
      { indexed: false, internalType: "uint256", name: "triggerPrice", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "attachedStopLoss", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "attachedTakeProfit", type: "uint256" }
    ],
    name: "LimitOrderCreated",
    type: "event"
  }
] as const;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const channelAddress = searchParams.get('channelAddress') as `0x${string}`;
  const limitOrderBookAddress = searchParams.get('limitOrderBookAddress') as `0x${string}`;

  if (!channelAddress || !limitOrderBookAddress) {
    return NextResponse.json(
      { error: 'channelAddress and limitOrderBookAddress are required' },
      { status: 400 }
    );
  }

  try {
    // Query LimitOrderCreated events filtered by trader address
    const logs = await client.getLogs({
      address: limitOrderBookAddress,
      event: limitOrderBookAbi.find(item => item.type === 'event' && item.name === 'LimitOrderCreated')!,
      args: {
        trader: channelAddress
      },
      fromBlock: 0n
    });

    // Create contract instance for reading order details
    const contract = getContract({
      address: limitOrderBookAddress,
      abi: limitOrderBookAbi,
      client
    });

    // Get current state of each order
    const orders = await Promise.all(
      logs.map(async (log) => {
        const orderId = log.args.orderId;
        if (!orderId) return null;
        
        const order = await contract.read.getLimitOrder([orderId]);

        // If trader is 0x0, order was executed/cancelled
        if (order.trader === '0x0000000000000000000000000000000000000000') {
          return null;
        }

        return {
          orderId,
          trader: order.trader,
          collateral: order.collateral.toString(),
          size: order.size.toString(),
          isLong: order.isLong,
          triggerPrice: order.triggerPrice.toString(),
          attachedStopLoss: order.attachedStopLoss.toString(),
          attachedTakeProfit: order.attachedTakeProfit.toString(),
          expiryTime: order.expiryTime.toString(),
          createdTime: order.createdTime.toString()
        };
      })
    );

    // Filter out cancelled/executed orders
    const activeOrders = orders.filter(order => order !== null);

    return NextResponse.json({ success: true, orders: activeOrders });
  } catch (error) {
    console.error('Failed to fetch limit orders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch limit orders' },
      { status: 500 }
    );
  }
}