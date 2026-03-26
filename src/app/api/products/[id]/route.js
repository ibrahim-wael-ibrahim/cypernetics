import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, unauthorizedResponse, forbiddenResponse } from '@/lib/middleware';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// GET /api/products/[id] - Get single product by ID
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const product = await db.product.findUnique({
      where: { id },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id] - Update product (admin only)
export async function PUT(request, { params }) {
  try {
    // Verify admin access
    const authResult = await requireAdmin(request);
    if (!authResult.success) {
      if (authResult.error === 'Admin access required') {
        return forbiddenResponse(authResult.error);
      }
      return unauthorizedResponse(authResult.error);
    }

    const { id } = await params;

    // Check if product exists
    const existingProduct = await db.product.findUnique({ where: { id } });
    if (!existingProduct) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const name = formData.get('name');
    const description = formData.get('description');
    const priceStr = formData.get('price');
    const stockQuantityStr = formData.get('stockQuantity');
    const category = formData.get('category');
    const imageFile = formData.get('image');
    const removeImage = formData.get('removeImage') === 'true';

    const updateData = {};

    if (name !== null) {
      if (!name.trim()) return NextResponse.json({ success: false, error: 'Product name cannot be empty' }, { status: 400 });
      updateData.name = name;
    }
    if (description !== null) updateData.description = description || null;
    if (priceStr !== null) {
      const price = parseFloat(priceStr);
      if (isNaN(price)) return NextResponse.json({ success: false, error: 'Invalid price value' }, { status: 400 });
      if (price < 0) return NextResponse.json({ success: false, error: 'Price cannot be negative' }, { status: 400 });
      updateData.price = price;
    }
    if (stockQuantityStr !== null) {
      const stockQuantity = parseInt(stockQuantityStr);
      if (isNaN(stockQuantity)) return NextResponse.json({ success: false, error: 'Invalid stock quantity value' }, { status: 400 });
      updateData.stockQuantity = stockQuantity;
    }
    if (category !== null) updateData.category = category || null;

    // Handle image removal
    if (removeImage && existingProduct.imageUrl) {
      try {
        const oldImagePath = path.join(process.cwd(), 'public', existingProduct.imageUrl);
        if (existsSync(oldImagePath)) await unlink(oldImagePath);
      } catch (err) {
        console.error('Error removing old image:', err);
      }
      updateData.imageUrl = null;
    }

    // Handle new image upload
    if (imageFile && imageFile.size > 0) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(imageFile.type)) return NextResponse.json({ success: false, error: 'Invalid image type. Allowed: JPEG, PNG, GIF, WebP' }, { status: 400 });
      const maxSize = 5 * 1024 * 1024;
      if (imageFile.size > maxSize) return NextResponse.json({ success: false, error: 'Image size too large. Maximum: 5MB' }, { status: 400 });

      // Remove old image if exists
      if (existingProduct.imageUrl) {
        try {
          const oldImagePath = path.join(process.cwd(), 'public', existingProduct.imageUrl);
          if (existsSync(oldImagePath)) await unlink(oldImagePath);
        } catch (err) {
          console.error('Error removing old image:', err);
        }
      }

      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'products');
      if (!existsSync(uploadsDir)) await mkdir(uploadsDir, { recursive: true });

      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = imageFile.name.split('.').pop() || 'jpg';
      const fileName = `${timestamp}-${randomString}.${fileExtension}`;
      const filePath = path.join(uploadsDir, fileName);

      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);

      updateData.imageUrl = `/uploads/products/${fileName}`;
    }

    const product = await db.product.update({ where: { id }, data: updateData });

    return NextResponse.json({ success: true, data: product, message: 'Product updated successfully' });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ success: false, error: 'Failed to update product' }, { status: 500 });
  }
}

// DELETE /api/products/[id] - Delete product (admin only)
export async function DELETE(request, { params }) {
  try {
    const authResult = await requireAdmin(request);
    if (!authResult.success) {
      if (authResult.error === 'Admin access required') return forbiddenResponse(authResult.error);
      return unauthorizedResponse(authResult.error);
    }

    const { id } = await params;
    const existingProduct = await db.product.findUnique({ where: { id } });
    if (!existingProduct) return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });

    const orderItemsCount = await db.orderItem.count({ where: { productId: id } });
    if (orderItemsCount > 0) return NextResponse.json({ success: false, error: 'Cannot delete product that has been ordered. Consider setting stock to 0 instead.' }, { status: 400 });

    if (existingProduct.imageUrl) {
      try {
        const imagePath = path.join(process.cwd(), 'public', existingProduct.imageUrl);
        if (existsSync(imagePath)) await unlink(imagePath);
      } catch (err) {
        console.error('Error removing image file:', err);
      }
    }

    await db.product.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete product' }, { status: 500 });
  }
}