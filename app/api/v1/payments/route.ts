import { NextRequest, NextResponse } from 'next/server';
import { getTravelStore } from '@/lib/travel-system/store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const idempotencyKey = req.headers.get('idempotency-key') || body.idempotencyKey;

    if (!body.bookingId || !body.paymentMethod) {
      return NextResponse.json(
        { success: false, message: 'Validation failed: bookingId and paymentMethod are required' },
        { status: 400 }
      );
    }

    const store = getTravelStore();
    const result = store.processPayment({
      bookingId: body.bookingId,
      method: body.paymentMethod,
      idempotencyKey,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Payment processed and verified successfully. Booking confirmed and invoice generated.',
        data: result,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Payment processing failed' }, { status: 400 });
  }
}
