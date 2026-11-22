import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { arbitrumSepolia } from 'viem/chains';

const ALCHEMY_KEY = process.env.ALCHEMY_KEY;
const USDC_ADDRESS = process.env.USDC_CONTRACT_ADDRESS;

const client = createPublicClient({
  chain: arbitrumSepolia,
  transport: http(`https://arb-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`)
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address') as `0x${string}`;
  const channelsParam = searchParams.get('channels');

  if (!address || !channelsParam) return NextResponse.json({ error: 'Address and channels required' }, { status: 400 });

  const channels = channelsParam.split(',').map(c => c.trim() as `0x${string}`);

  console.log('User channels:', channels);
  try{
    // 2. Fetch current total balance across all channels
    let currentBalance = 0;
    for (const channel of channels) {
      const balanceRaw = await client.readContract({
        address: USDC_ADDRESS as `0x${string}`,
        abi: [{ inputs: [{ name: 'account', type: 'address' }], name: 'balanceOf', outputs: [{ name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' }],
        functionName: 'balanceOf',
        args: [channel]
      });
      currentBalance += Number(balanceRaw) / 1e6;
    }

    // 3. Fetch historical transfers via raw Alchemy RPC for each channel
    const fetchTransfersForChannels = async (direction: 'fromAddress' | 'toAddress') => {
      const allTransfers = [];
      for (const channel of channels) {
        const res = await fetch(`https://arb-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`, {
          method: 'POST',
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "alchemy_getAssetTransfers",
            params: [{
              fromBlock: "0x0",
              [direction]: channel,
              contractAddresses: [USDC_ADDRESS],
              category: ["erc20"],
              withMetadata: true
            }]
          })
        });
        const json = await res.json();
        allTransfers.push(...(json.result?.transfers || []));
      }
      return allTransfers;
    };

    const [inbound, outbound] = await Promise.all([fetchTransfersForChannels('toAddress'), fetchTransfersForChannels('fromAddress')]);

    // 3. Combine and sort transfers by time (descending)
    const transfers = [
      ...inbound.map((t: any) => ({ ...t, type: 'in' })),
      ...outbound.map((t: any) => ({ ...t, type: 'out' }))
    ].sort((a, b) => new Date(b.metadata.blockTimestamp).getTime() - new Date(a.metadata.blockTimestamp).getTime());

    // 4. Map to 30-day historical points
    const dailyPoints: Record<string, number> = {};
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dailyPoints[date.toISOString().split('T')[0]] = 0;
    }

    let runningBalance = currentBalance;
    const sortedDates = Object.keys(dailyPoints).sort().reverse();
    const history = [];

    for (const date of sortedDates) {
      const dayNetChange = transfers
        .filter((t: any) => t.metadata.blockTimestamp.startsWith(date))
        .reduce((acc: number, t: any) => t.type === 'in' ? acc + Number(t.value) : acc - Number(t.value), 0);
      
      history.push({ date, balance: Math.max(0, runningBalance) });
      runningBalance -= dayNetChange;
    }

    return NextResponse.json(history.reverse());
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
