import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

import { API_BASE_URL } from '@/constants/server/serverRoutes'
import { API_ROUTES, ROUTES } from '@/constants/routes'

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'DS API',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }
        // MOCK AUTH PARA DESARROLLO SIN BACKEND
        // Si ingresas cualquier credencial, te deja pasar
        return {
          id: '1',
          name: 'Admin Prueba',
          email: 'admin@prueba.com',
          username: credentials?.username || 'admin',
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token'
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken
        token.refreshToken = user.refreshToken
        token.username = user.username
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub || ''
        session.user.username = token.username
        session.accessToken = token.accessToken
        session.refreshToken = token.refreshToken
      }

      return session
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`
      }

      if (new URL(url).origin === baseUrl) {
        return url
      }

      return `${baseUrl}${ROUTES.HOME}`
    }
  },
  pages: {
    signIn: '/login'
  },
  session: {
    strategy: 'jwt'
  },
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  }
})

export { handler as GET, handler as POST }
