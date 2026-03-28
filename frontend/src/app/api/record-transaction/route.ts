import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Column names MUST match the cerc_audit_trail table schema exactly.
// The table was created with camelCase columns matching the webhook route.
// Run this SQL in Supabase if new columns are needed:
//
//   ALTER TABLE cerc_audit_trail
//     ADD COLUMN IF NOT EXISTS "tokenId" integer,
//     ADD COLUMN IF NOT EXISTS "amount" numeric,
//     ADD COLUMN IF NOT EXISTS "listingId" text,
//     ADD COLUMN IF NOT EXISTS "isDemo" boolean DEFAULT false,
//     ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'demo';

export interface TransactionRecord {
  transaction_hash: string;
  buyer_address: string;
  asset_type: string;
  token_id?: number;
  amount?: number;
  price_inr?: number;
  listing_id?: string;
  is_demo?: boolean;
  status?: string;
}

export async function POST(req: Request) {
  try {
    const body: TransactionRecord = await req.json();

    if (!body.buyer_address || !body.transaction_hash) {
      return NextResponse.json({ error: 'buyer_address and transaction_hash are required' }, { status: 400 });
    }

    console.log('[record-transaction] Inserting:', body);

    // Use the camelCase columns that match the original table schema
    const row: Record<string, unknown> = {
      transactionHash: body.transaction_hash,
      buyerAddress: body.buyer_address,
      assetType: body.asset_type,
      amountInINR: body.price_inr ?? 0,
      timestamp: new Date().toISOString(),
    };

    // Add extra columns only if they exist in the table
    if (body.token_id !== undefined) row.tokenId = body.token_id;
    if (body.amount !== undefined) row.amount = body.amount;
    if (body.listing_id !== undefined) row.listingId = body.listing_id;
    if (body.is_demo !== undefined) row.isDemo = body.is_demo;
    if (body.status !== undefined) row.status = body.status;

    // First try with all columns
    let result = await supabase
      .from('cerc_audit_trail')
      .insert(row);

    // If it fails (missing column), retry with just the core 5 columns
    if (result.error) {
      console.warn('[record-transaction] Full insert failed, retrying with core columns:', result.error.message);
      const coreRow = {
        transactionHash: body.transaction_hash,
        buyerAddress: body.buyer_address,
        assetType: body.asset_type,
        amountInINR: body.price_inr ?? 0,
        timestamp: new Date().toISOString(),
      };
      result = await supabase.from('cerc_audit_trail').insert(coreRow);
    }

    if (result.error) {
      console.error('[record-transaction] Supabase error:', result.error);
      return NextResponse.json({ success: false, error: result.error.message }, { status: 200 });
    }

    console.log('[record-transaction] Success!');
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (err: any) {
    console.error('[record-transaction] Unexpected error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to record transaction' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const result = await supabase
      .from('cerc_audit_trail')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(50);

    if (result.error) {
      console.error('[record-transaction GET] Supabase error:', result.error);
      return NextResponse.json({ transactions: [] }, { status: 200 });
    }

    // Normalize field names for the frontend (handle both camelCase and snake_case)
    const normalized = (result.data || []).map((row: any) => ({
      id: row.id,
      transactionHash: row.transactionHash || row.transaction_hash || row.tx_hash,
      buyerAddress: row.buyerAddress || row.buyer_address,
      assetType: row.assetType || row.asset_type,
      amount: row.amount ?? 0,
      amountInINR: row.amountInINR || row.amount_in_inr || row.price_inr || 0,
      tokenId: row.tokenId || row.token_id,
      listingId: row.listingId || row.listing_id,
      isDemo: row.isDemo ?? row.is_demo ?? false,
      status: row.status || 'confirmed',
      timestamp: row.timestamp || row.created_at,
    }));

    return NextResponse.json({ transactions: normalized }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message, transactions: [] }, { status: 200 });
  }
}
