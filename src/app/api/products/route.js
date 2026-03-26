import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, unauthorizedResponse, forbiddenResponse } from '@/lib/middleware';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// GET /api/products - List all products with optional category filter
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build filter conditions
    const where = {};
    
    if (category) {
      where.category = category;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }
    
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) {
        where.price.gte = parseFloat(minPrice);
      }
      if (maxPrice) {
        where.price.lte = parseFloat(maxPrice);
      }
    }

    // Build sort conditions
    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    // Get products with pagination
    const [products, total] = await Promise.all([
    db.product.findMany({
  where,
  orderBy,
  skip,
  take: limit,
  select: {
    id: true,
    name: true,
    description: true,
    price: true,
    stockQuantity: true,
    category: true,
    createdAt: true,
    updatedAt: true,
    imageUrl: true,
  },
}),

    db.product.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST /api/products - Create new product (admin only)
export async function POST(request) {
  try {
    // Verify admin access
    const authResult = await requireAdmin(request);
    if (!authResult.success) {
      if (authResult.error === 'Admin access required') {
        return forbiddenResponse(authResult.error);
      }
      return unauthorizedResponse(authResult.error);
    }

    // Parse FormData
    const formData = await request.formData();
    
    const name = formData.get('name');
    const description = formData.get('description');
    const price = parseFloat(formData.get('price'));
    const stockQuantity = parseInt(formData.get('stockQuantity')) || 0;
    const category = formData.get('category');
    const imageFile = formData.get('image');

    // Validate required fields
    if (!name || isNaN(price)) {
      return NextResponse.json(
        { success: false, error: 'Name and price are required' },
        { status: 400 }
      );
    }

    if (price < 0) {
      return NextResponse.json(
        { success: false, error: 'Price cannot be negative' },
        { status: 400 }
      );
    }

    let imageUrl = null;

    // Handle image upload
    if (imageFile && imageFile.size > 0) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(imageFile.type)) {
        return NextResponse.json(
          { success: false, error: 'Invalid image type. Allowed: JPEG, PNG, GIF, WebP' },
          { status: 400 }
        );
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (imageFile.size > maxSize) {
        return NextResponse.json(
          { success: false, error: 'Image size too large. Maximum: 5MB' },
          { status: 400 }
        );
      }

      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'products');
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = imageFile.name.split('.').pop() || 'jpg';
      const fileName = `${timestamp}-${randomString}.${fileExtension}`;
      const filePath = path.join(uploadsDir, fileName);

      // Write file to disk
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);

      // Store relative path
      imageUrl = `/uploads/products/${fileName}`;
    }

    // Create product in database
    const product = await db.product.create({
      data: {
        name,
        description: description || null,
        price,
        stockQuantity,
        category: category || null,
        imageUrl,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: product,
        message: 'Product created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create product' },
      { status: 500 }
    );
  }
}