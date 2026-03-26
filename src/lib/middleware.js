import { NextResponse } from 'next/server';
import { jwtVerify, SignJWT } from 'jose';

const JWT_SECRET =
  process.env.JWT_SECRET ||
  'your-super-secret-jwt-key-change-in-production-min-32-chars';

/**
 * Verify JWT token from Authorization header
 */
export async function verifyAuth(request) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false, error: 'No authorization token provided' };
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
    });

    return {
      success: true,
      user: {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
      },
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('exp')) {
        return { success: false, error: 'Token has expired' };
      }
      if (error.message.includes('invalid')) {
        return { success: false, error: 'Invalid token' };
      }
    }
    return { success: false, error: 'Authentication failed' };
  }
}

/**
 * Require admin role for protected routes
 */
export async function requireAdmin(request) {
  const authResult = await verifyAuth(request);

  if (!authResult.success) {
    return authResult;
  }

  if (authResult.user?.role !== 'admin') {
    return { success: false, error: 'Admin access required' };
  }

  return authResult;
}

/**
 * Generate JWT token for user
 */
export async function generateToken(payload) {
  const secret = new TextEncoder().encode(JWT_SECRET);

  const token = await new SignJWT({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);

  return token;
}

/**
 * Create unauthorized response
 */
export function unauthorizedResponse(error = 'Unauthorized') {
  return NextResponse.json(
    { success: false, error },
    { status: 401 }
  );
}

/**
 * Create forbidden response
 */
export function forbiddenResponse(error = 'Forbidden') {
  return NextResponse.json(
    { success: false, error },
    { status: 403 }
  );
}