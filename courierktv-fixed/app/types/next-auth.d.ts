
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      city?: string;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    city?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    city?: string;
  }
}
