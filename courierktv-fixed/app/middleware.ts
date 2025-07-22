
import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware(req) {
    // Дополнительная логика middleware здесь при необходимости
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Защищаем основные роуты
        if (req.nextUrl.pathname === '/' || req.nextUrl.pathname.startsWith('/api/')) {
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
    '/api/shifts/:path*',
    '/api/orders/:path*',
    '/api/zones/:path*'
  ]
};
