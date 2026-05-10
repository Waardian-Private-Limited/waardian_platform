import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  // Completely block requests from browser extensions / devtools that cause server-side crashes
  if (req.nextUrl.pathname.startsWith('/.well-known')) {
    return new NextResponse(null, { status: 204 });
  }
  
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: '/.well-known/:path*',
};
