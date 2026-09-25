import { NextRequest, NextResponse } from 'next/server';
import { getTravelStore } from '@/lib/travel-system/store';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const packageId = searchParams.get('packageId') || undefined;

  const store = getTravelStore();
  const schedules = store.getSchedules(packageId);

  return NextResponse.json({
    success: true,
    message: 'Schedules retrieved successfully',
    data: schedules,
    meta: {
      total: schedules.length,
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
    const adminUser = store.getUsers().find((u) => u.role === 'ADMIN') || store.getUsers()[0];

    if (!body.packageId || !body.departureDate || !body.returnDate || !body.quota) {
      return NextResponse.json(
        { success: false, message: 'Validation failed: packageId, departureDate, returnDate, and quota required' },
        { status: 400 }
      );
    }

    const created = store.createSchedule(
      {
        packageId: body.packageId,
        departureDate: body.departureDate,
        returnDate: body.returnDate,
        quota: Number(body.quota),
        remainingQuota: Number(body.quota),
        status: 'AVAILABLE',
        seasonalSurgeMultiplier: body.seasonalSurgeMultiplier ? Number(body.seasonalSurgeMultiplier) : 1.0,
      },
      adminUser
    );

    return NextResponse.json(
      { success: true, message: 'Schedule created successfully', data: created },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
