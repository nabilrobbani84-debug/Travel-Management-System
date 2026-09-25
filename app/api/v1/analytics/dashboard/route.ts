import { NextResponse } from 'next/server';
import { getTravelStore } from '@/lib/travel-system/store';

export async function GET() {
  const store = getTravelStore();
  const analytics = store.getAnalyticsDashboard();

  return NextResponse.json({
    success: true,
    message: 'Dashboard analytics retrieved successfully',
    data: analytics,
  });
}
