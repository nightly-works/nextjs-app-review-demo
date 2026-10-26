import { NextResponse, type NextRequest } from 'next/server';

// Signed-out visitors are sent to the login page.
export function proxy(request: NextRequest) {
  if (!request.cookies.get('session')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
