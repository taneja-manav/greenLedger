import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { executeAtomicSwap } from '@/lib/blockchain';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');
    const isMock = req.headers.get('x-mock-payment') === 'true';

    // Skip signature verification for mock payments
    if (!isMock) {
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

      if (!signature || !webhookSecret) {
        console.error('Missing Razorpay signature or webhook secret configuration');
        return NextResponse.json({ error: 'Missing configuration setup' }, { status: 400 });
      }

      // Verify exactly as Razorpay requires:
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      if (expectedSignature !== signature) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      }
    }

    const event = JSON.parse(rawBody);

    // Ensure we are only dealing with payment captured events
    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      const amountInINR = payment.currency === 'INR' ? payment.amount / 100 : payment.amount;
      
      const notes = payment.notes || {};
      const { listingId, buyerAddress, assetType } = notes;

      if (!listingId || !buyerAddress) {
         console.error('Missing listingId or buyerAddress in notes.');
         return NextResponse.json({ status: 'Notes incomplete, skipping execution' }, { status: 200 });
      }

      console.log(`Payment captured. Executing swap for Listing: ${listingId}, Buyer: ${buyerAddress}`);
      
      // Relayer action: Ethers.js writes to Sepolia blockchain
      const transactionHash = await executeAtomicSwap(listingId, buyerAddress);

      console.log(`Swap successful. Logging audit trail locally for grid regulator view...`);

      // Database Action: Write to Supabase table for CERC Audit Trail
      const { error: dbError } = await supabase
        .from('cerc_audit_trail')
        .insert({
          transactionHash,
          buyerAddress,
          assetType: assetType || 'UNKNOWN_ASSET',
          amountInINR,
          timestamp: new Date().toISOString()
        });

      if (dbError) {
        console.error('Failed to log transaction to regulator audit trail:', dbError.message);
        // Note: although failed to log, the transaction completed on chain. 
      }
    }

    // Acknowledge the webhook successfully
    return NextResponse.json({ status: 'ok' }, { status: 200 });

  } catch (error: any) {
    console.error('Error handling Razorpay webhook:', error);
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}
