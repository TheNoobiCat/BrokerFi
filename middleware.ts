import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host');

  if (hostname === 'testnet.brokerfi.trade') {
    // This creates a clean redirect to the homepage only
    return NextResponse.redirect('https://brokerfi.trade', 308);
  }
}
