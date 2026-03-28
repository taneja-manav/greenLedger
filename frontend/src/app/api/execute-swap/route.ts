import { NextResponse } from 'next/server';
import { executeAtomicSwap } from '@/lib/blockchain';

export async function POST(req: Request) {
  try {
    const { listingId, buyerAddress } = await req.json();

    if (!listingId === undefined || !buyerAddress) {
      return NextResponse.json({ error: 'listingId and buyerAddress are required' }, { status: 400 });
    }

    const txHash = await executeAtomicSwap(String(listingId), buyerAddress);
    return NextResponse.json({ success: true, txHash }, { status: 200 });

  } catch (error: any) {
    console.error('Error executing atomic swap:', error);
    return NextResponse.json({ error: error?.message || 'Swap execution failed' }, { status: 500 });
  }
}
