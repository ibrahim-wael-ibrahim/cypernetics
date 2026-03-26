import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, unauthorizedResponse, forbiddenResponse } from '@/lib/middleware';

// Valid order statuses
const VALID_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

// GET /api/admin/orders - Get all orders with pagination (admin only)
export async function GET(request) {
  try {
    // Verify admin access
    const authResult = await requireAdmin(request);
    if (!authResult.success) {
      if (authResult.error === 'Admin access required') {
        return forbiddenResponse(authResult.error);
      }
      return unauthorizedResponse(authResult.error || 'Unauthorized');
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const skip = (page - 1) * limit;

    // Build filter conditions
    const where = {};
    
    if (status && VALID_STATUSES.includes(status)) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { id: { contains: search } },
        { user: { email: { contains: search } } },
        { user: { name: { contains: search } } },
      ];
    }

    // Build sort conditions
    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    // Get orders with pagination
    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  imageUrl: true,
                },
              },
            },
          },
          shipping: true,
        },
      }),
      db.order.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/orders - Update order status (admin only)
export async function PUT(request) {
  try {
    // Verify admin access
    const authResult = await requireAdmin(request);
    if (!authResult.success) {
      if (authResult.error === 'Admin access required') {
        return forbiddenResponse(authResult.error);
      }
      return unauthorizedResponse(authResult.error || 'Unauthorized');
    }

    const body = await request.json();
    const { orderId, status } = body;

    // Validate required fields
    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Valid statuses: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    // Check if order exists
    const existingOrder = await db.order.findUnique({
      where: { id: orderId },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // If cancelling order, restore stock quantities
    if (status === 'cancelled' && existingOrder.status !== 'cancelled') {
      await db.$transaction(async (tx) => {
        // Get order items
        const orderItems = await tx.orderItem.findMany({
          where: { orderId },
        });

        // Restore stock for each item
        for (const item of orderItems) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: {
                increment: item.quantity,
              },
            },
          });
        }

        // Update order status
        await tx.order.update({
          where: { id: orderId },
          data: { status },
        });
      });
    } else {
      // Just update status
      await db.order.update({
        where: { id: orderId },
        data: { status },
      });
    }

    // Get updated order
    const updatedOrder = await db.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
              },
            },
          },
        },
        shipping: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedOrder,
      message: 'Order status updated successfully',
    });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update order' },
      { status: 500 }
    );
  }
}