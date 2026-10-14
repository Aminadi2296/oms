import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

import { API_BASE_URL } from '@/constants/server/serverRoutes'
import { ROUTES } from '@/constants/routes'

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

        try {
          // FastAPI usa OAuth2PasswordRequestForm: form-urlencoded con "username" y "password"
          const body = new URLSearchParams()

          body.append('username', credentials.username)
          body.append('password', credentials.password)

          const loginRes = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body
          })

          if (!loginRes.ok) return null

          const data = await loginRes.json() // { access_token, token_type }

          // Perfil del usuario con el token recién obtenido
          const meRes = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${data.access_token}` }
          })

          const me = meRes.ok ? await meRes.json() : {}

          return {
            id: String(me.id ?? ''),
            name: me.full_name ?? '',
            email: me.email ?? credentials.username,
            username: credentials.username,
            accessToken: data.access_token,
            refreshToken: ''
          }
        } catch (error) {
          console.error('Login error:', error)

          return null
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
