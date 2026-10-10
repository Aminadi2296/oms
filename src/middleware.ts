import { NextResponse } from 'next/server'

import { withAuth } from 'next-auth/middleware'

export default withAuth(
  function middleware() {
    // custom logic here
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    }
  }
)

export const config = {
  matcher: ['/((?!api/auth|login|_next/static|_next/image|images|favicon.ico).*)']
}
