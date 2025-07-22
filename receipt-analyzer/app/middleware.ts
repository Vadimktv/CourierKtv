
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const userRole = req.nextauth.token?.role;
    
    console.log('Middleware:', { pathname, userRole, hasToken: !!req.nextauth.token });

    // Redirect authenticated users from home page to their dashboard
    if (pathname === '/' && req.nextauth.token && userRole) {
      if (userRole === 'courier') {
        return NextResponse.redirect(new URL('/courier', req.url));
      } else if (userRole === 'restaurant') {
        return NextResponse.redirect(new URL('/restaurant', req.url));
      }
    }

    // Protect courier routes
    if (pathname.startsWith('/courier')) {
      if (userRole !== 'courier') {
        console.log('Courier route access denied:', { userRole });
        return NextResponse.redirect(new URL('/', req.url));
      }
    }

    // Protect restaurant routes
    if (pathname.startsWith('/restaurant')) {
      if (userRole !== 'restaurant') {
        console.log('Restaurant route access denied:', { userRole });
        return NextResponse.redirect(new URL('/', req.url));
      }
    }

    // Protect API routes
    if (pathname.startsWith('/api/orders') || 
        pathname.startsWith('/api/shifts') || 
        pathname.startsWith('/api/statistics') ||
        pathname.startsWith('/api/zones')) {
      if (userRole !== 'courier') {
        return NextResponse.json(
          { error: 'Доступ запрещен' },
          { status: 403 }
        );
      }
    }

    if (pathname.startsWith('/api/restaurant')) {
      if (userRole !== 'restaurant') {
        return NextResponse.json(
          { error: 'Доступ запрещен' },
          { status: 403 }
        );
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Allow access to auth pages and home page
        if (pathname.startsWith('/auth/') || pathname === '/') {
          return true;
        }

        // For protected routes, require authentication
        if (pathname.startsWith('/courier') || 
            pathname.startsWith('/restaurant') ||
            pathname.startsWith('/api/orders') ||
            pathname.startsWith('/api/shifts') ||
            pathname.startsWith('/api/statistics') ||
            pathname.startsWith('/api/zones') ||
            pathname.startsWith('/api/restaurant')) {
          return !!token;
        }

        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    '/',
    '/courier/:path*',
    '/restaurant/:path*',
    '/api/orders/:path*',
    '/api/shifts/:path*',
    '/api/statistics/:path*',
    '/api/zones/:path*',
    '/api/restaurant/:path*',
  ]
};
