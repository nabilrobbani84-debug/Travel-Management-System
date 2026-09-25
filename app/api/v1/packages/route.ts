import { NextRequest, NextResponse } from 'next/server';
import { getTravelStore } from '@/lib/travel-system/store';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || undefined;
  const destinationId = searchParams.get('destinationId') || undefined;
  const category = searchParams.get('category') || undefined;
  const featured = searchParams.get('featured') ? searchParams.get('featured') === 'true' : undefined;

  const store = getTravelStore();
  const packages = store.getPackages({
    search,
    destinationId,
    category,
    featured,
  });

  return NextResponse.json({
    success: true,
    message: 'Travel packages retrieved successfully',
    data: packages,
    meta: {
      total: packages.length,
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

    if (!body.title || !body.destinationId || !body.price || !body.quota) {
      return NextResponse.json(
        { success: false, message: 'Validation failed: title, destinationId, price, and quota are required' },
        { status: 400 }
      );
    }

    const created = store.createPackage(
      {
        destinationId: body.destinationId,
        title: body.title,
        slug: body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: body.description || '',
        duration: body.duration || '3D2N',
        durationDays: body.durationDays || 3,
        startLocation: body.startLocation || 'International Airport',
        endLocation: body.endLocation || 'International Airport',
        price: Number(body.price),
        discountPrice: body.discountPrice ? Number(body.discountPrice) : undefined,
        quota: Number(body.quota),
        availableQuota: Number(body.quota),
        minimumParticipant: Number(body.minimumParticipant || 1),
        maximumParticipant: Number(body.maximumParticipant || body.quota),
        status: 'ACTIVE',
        featured: Boolean(body.featured),
        category: body.category || 'BEACH',
        cancellationPolicy: body.cancellationPolicy || 'Standard 7-day cancellation policy applies.',
        imageUrl: body.imageUrl || 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
        gallery: body.gallery || [],
        itinerary: body.itinerary || [],
        hotels: body.hotels || [],
        transports: body.transports || [],
        inclusions: body.inclusions || ['Hotel Stay', 'Guided Tour', 'Daily Breakfast'],
        exclusions: body.exclusions || ['Airfare', 'Personal Expenses'],
        rating: 5.0,
        reviewCount: 0,
      },
      adminUser
    );

    return NextResponse.json(
      { success: true, message: 'Travel package created successfully', data: created },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
