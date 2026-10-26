import { NextResponse, type NextRequest } from 'next/server';

// Sends signed-out visitors to the login page. A convenience only: the proxy sees a cookie's
// presence, not its validity, and its matcher skips other routes, so every page, action and route
// handler checks the session itself.
export function proxy(request: NextRequest) {
  if (!request.cookies.get('session')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
