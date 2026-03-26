import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth, unauthorizedResponse } from '@/lib/middleware';

// PUT /api/cart/items/[id] - Update item quantity
export async function PUT(request, { params }) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return unauthorizedResponse(authResult.error);
    }

    const userId = authResult.user.userId;
    const { id } = await params;
    const body = await request.json();
    const { quantity } = body;

    // Validate quantity
    const quantityNum = parseInt(quantity?.toString() || '0');
    if (isNaN(quantityNum) || quantityNum < 0) {
      return NextResponse.json(
        { success: false, error: 'Quantity must be a non-negative number' },
        { status: 400 }
      );
    }

    // Get the cart item and verify ownership
    const cartItem = await db.cartItem.findUnique({
      where: { id },
      include: {
        cart: true,
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            stockQuantity: true,
            imageUrl: true,
          },
        },
      },
    });

    if (!cartItem) {
      return NextResponse.json(
        { success: false, error: 'Cart item not found' },
        { status: 404 }
      );
    }

    // Verify the cart belongs to the user
    if (cartItem.cart.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized access to cart item' },
        { status: 403 }
      );
    }

    // If quantity is 0, remove the item
    if (quantityNum === 0) {
      await db.cartItem.delete({
        where: { id },
      });

      return NextResponse.json({
        success: true,
        message: 'Item removed from cart',
        data: null,
      });
    }

    // Check if quantity exceeds stock
    if (quantityNum > cartItem.product.stockQuantity) {
      return NextResponse.json(
        { success: false, error: `Insufficient stock. Available: ${cartItem.product.stockQuantity}` },
        { status: 400 }
      );
    }

    // Update the quantity
    const updatedItem = await db.cartItem.update({
      where: { id },
      data: { quantity: quantityNum },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            stockQuantity: true,
            imageUrl: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedItem.id,
        productId: updatedItem.productId,
        quantity: updatedItem.quantity,
        product: updatedItem.product,
        subtotal: updatedItem.product.price * updatedItem.quantity,
      },
      message: 'Cart item updated',
    });
  } catch (error) {
    console.error('Error updating cart item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update cart item' },
      { status: 500 }
    );
  }
}

// DELETE /api/cart/items/[id] - Remove item from cart
export async function DELETE(request, { params }) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return unauthorizedResponse(authResult.error);
    }

    const userId = authResult.user.userId;
    const { id } = await params;

    // Get the cart item and verify ownership
    const cartItem = await db.cartItem.findUnique({
      where: { id },
      include: {
        cart: true,
      },
    });

    if (!cartItem) {
      return NextResponse.json(
        { success: false, error: 'Cart item not found' },
        { status: 404 }
      );
    }

    // Verify the cart belongs to the user
    if (cartItem.cart.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized access to cart item' },
        { status: 403 }
      );
    }

    // Delete the item
    await db.cartItem.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Item removed from cart',
    });
  } catch (error) {
    console.error('Error removing cart item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove cart item' },
      { status: 500 }
    );
  }
}