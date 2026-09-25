import { NextResponse } from 'next/server';
import { getTravelStore } from '@/lib/travel-system/store';

export async function GET() {
  const store = getTravelStore();
  const logs = store.getAuditLogs();

  return NextResponse.json({
    success: true,
    message: 'Audit logs retrieved successfully',
    data: logs,
    meta: {
      total: logs.length,
      page: 1,
      limit: 100,
      totalPages: 1,
    },
  });
}
