import { NextRequest, NextResponse } from 'next/server';
import { getTravelStore } from '@/lib/travel-system/store';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId') || undefined;
  const status = searchParams.get('status') || undefined;
  const search = searchParams.get('search') || undefined;

  const store = getTravelStore();
  const bookings = store.getBookings({ userId, status, search });

  return NextResponse.json({
    success: true,
    message: 'Bookings retrieved successfully',
    data: bookings,
    meta: {
      total: bookings.length,
      page: 1,
      limit: 50,
      totalPages: 1,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const store = getTravelStore();

    if (!body.userId || !body.packageId || !body.scheduleId || !body.travelers || !body.travelers.length) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed: userId, packageId, scheduleId, and travelers array are required',
        },
        { status: 400 }
      );
    }

    const booking = store.createBooking({
      userId: body.userId,
      packageId: body.packageId,
      scheduleId: body.scheduleId,
      travelers: body.travelers,
      couponCode: body.couponCode,
      paymentMethod: body.paymentMethod,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Booking created and quota reserved successfully. Please complete payment within 15 minutes.',
        data: booking,
      },
      { status: 201 }
    );
  } catch (error: any) {
    const isConflict = error.message && error.message.includes('CONCURRENCY ERROR');
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create booking' },
      { status: isConflict ? 409 : 400 }
    );
  }
}
