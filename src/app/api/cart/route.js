import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth, unauthorizedResponse } from '@/lib/middleware';

// GET /api/cart - Get current user's cart with all items and product details
export async function GET(request) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return unauthorizedResponse(authResult.error);
    }

    const userId = authResult.user.userId;

    // Get cart with items and product details
    const cart = await db.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                description: true,
                price: true,
                stockQuantity: true,
                imageUrl: true,
                category: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!cart) {
      // Return empty cart if user has no cart yet
      return NextResponse.json({
        success: true,
        data: {
          id: null,
          items: [],
          itemCount: 0,
          subtotal: 0,
        },
      });
    }

    // Calculate totals
    const itemsWithSubtotal = cart.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      product: item.product,
      subtotal: item.product.price * item.quantity,
    }));

    const subtotal = itemsWithSubtotal.reduce((sum, item) => sum + item.subtotal, 0);
    const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    return NextResponse.json({
      success: true,
      data: {
        id: cart.id,
        items: itemsWithSubtotal,
        itemCount,
        subtotal,
        createdAt: cart.createdAt,
        updatedAt: cart.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cart' },
      { status: 500 }
    );
  }
}

// POST /api/cart - Add item to cart
export async function POST(request) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return unauthorizedResponse(authResult.error);
    }

    const userId = authResult.user.userId;
    const body = await request.json();
    const { productId, quantity = 1 } = body;

    // Validate required fields
    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const quantityNum = parseInt(quantity.toString());
    if (isNaN(quantityNum) || quantityNum < 1) {
      return NextResponse.json(
        { success: false, error: 'Quantity must be a positive number' },
        { status: 400 }
      );
    }

    // Check if product exists and has enough stock
    const product = await db.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    if (product.stockQuantity < quantityNum) {
      return NextResponse.json(
        { success: false, error: `Insufficient stock. Available: ${product.stockQuantity}` },
        { status: 400 }
      );
    }

    // Get or create cart
    let cart = await db.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      cart = await db.cart.create({
        data: { userId },
      });
    }

    // Check if item already exists in cart
    const existingItem = await db.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    if (existingItem) {
      // Check if new total quantity exceeds stock
      const newQuantity = existingItem.quantity + quantityNum;
      if (newQuantity > product.stockQuantity) {
        return NextResponse.json(
          { success: false, error: `Cannot add more. Current cart: ${existingItem.quantity}, Available stock: ${product.stockQuantity}` },
          { status: 400 }
        );
      }

      // Update existing item quantity
      const updatedItem = await db.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
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
        message: 'Cart item quantity updated',
      });
    }

    // Create new cart item
    const newItem = await db.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        quantity: quantityNum,
      },
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

    return NextResponse.json(
      {
        success: true,
        data: {
          id: newItem.id,
          productId: newItem.productId,
          quantity: newItem.quantity,
          product: newItem.product,
          subtotal: newItem.product.price * newItem.quantity,
        },
        message: 'Item added to cart',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding to cart:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add item to cart' },
      { status: 500 }
    );
  }
}

// DELETE /api/cart - Clear cart
export async function DELETE(request) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return unauthorizedResponse(authResult.error);
    }

    const userId = authResult.user.userId;

    // Get cart
    const cart = await db.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      return NextResponse.json({
        success: true,
        message: 'Cart is already empty',
      });
    }

    // Delete all cart items
    await db.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Cart cleared successfully',
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear cart' },
      { status: 500 }
    );
  }
}