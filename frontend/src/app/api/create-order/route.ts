import { NextResponse } from 'next/server';
import { razorpay } from '@/lib/razorpay';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, currency = 'INR', receipt, listingId, buyerAddress, assetType } = body;

    if (!amount || !listingId || !buyerAddress) {
      return NextResponse.json(
        { error: 'amount, listingId, and buyerAddress are required' },
        { status: 400 }
      );
    }

    // Creating a Razorpay order
    const options = {
      amount: amount * 100, // amount in smallest currency unit (paise for INR)
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      notes: {
        // Storing these to be retrieved in the Webhook when payment is captured
        listingId,
        buyerAddress,
        assetType: assetType || 'REC', 
      }
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error creating Razorpay order:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create Razorpay Order' },
      { status: 500 }
    );
  }
}
