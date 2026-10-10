import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface User {
    id: string
    name: string
    email: string
    username: string
    accessToken: string
    refreshToken: string
  }

  interface Session {
    user: {
      id: string
      name: string
      email: string
      username: string
    }
    accessToken: string
    refreshToken: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken: string
    refreshToken: string
    username: string
  }
}
