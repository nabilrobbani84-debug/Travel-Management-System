import { NextRequest, NextResponse } from 'next/server';
import { getTravelStore } from '@/lib/travel-system/store';

export async function GET(req: NextRequest) {
  const store = getTravelStore();
  const bookingsWithRefund = store.getBookings().filter((b) => b.refundStatus || b.bookingStatus === 'REFUND_REQUESTED' || b.bookingStatus === 'REFUNDED');

  return NextResponse.json({
    success: true,
    message: 'Refund records retrieved successfully',
    data: bookingsWithRefund,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const store = getTravelStore();
    const user = store.getUsers().find((u) => u.id === body.userId) || store.getUsers()[0];

    if (!body.bookingId || !body.reason) {
      return NextResponse.json(
        { success: false, message: 'Validation failed: bookingId and reason are required' },
        { status: 400 }
      );
    }

    const updated = store.requestRefund(body.bookingId, body.reason, user);

    return NextResponse.json({
      success: true,
      message: 'Refund request submitted successfully and queued for staff review.',
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Refund request failed' }, { status: 400 });
  }
}
