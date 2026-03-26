import { NextResponse } from 'next/server';

export async function POST() {
  // For JWT-based authentication, logout is handled client-side
  // by removing the token from local storage or cookies
  // This endpoint exists for consistency and future extensibility
  // (e.g., for token blacklisting or server-side session management)

  return NextResponse.json({
    message: 'Logout successful',
  });
}
