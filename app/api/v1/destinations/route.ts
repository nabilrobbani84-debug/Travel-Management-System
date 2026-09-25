import { NextRequest, NextResponse } from 'next/server';
import { getTravelStore } from '@/lib/travel-system/store';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || undefined;
  const category = searchParams.get('category') || undefined;

  const store = getTravelStore();
  const destinations = store.getDestinations(search, category);

  return NextResponse.json({
    success: true,
    message: 'Destinations retrieved successfully',
    data: destinations,
    meta: {
      total: destinations.length,
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

    if (!body.name || !body.country || !body.city) {
      return NextResponse.json(
        { success: false, message: 'Validation failed: name, country, and city are required fields' },
        { status: 400 }
      );
    }

    const created = store.createDestination(
      {
        name: body.name,
        slug: body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        country: body.country,
        city: body.city,
        description: body.description || '',
        latitude: body.latitude || -8.4095,
        longitude: body.longitude || 115.1889,
        timezone: body.timezone || 'WITA (UTC+8)',
        category: body.category || 'BEACH',
        imageUrl: body.imageUrl || 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
        gallery: body.gallery || [],
        featured: Boolean(body.featured),
        status: 'ACTIVE',
        rating: 5.0,
      },
      adminUser
    );

    return NextResponse.json(
      { success: true, message: 'Destination created successfully', data: created },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
