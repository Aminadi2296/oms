# NextAuth Setup Guide

This project has been configured with NextAuth.js to authenticate with the DS API.

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# DS API Configuration
API_BASE_URL=http://ds-api.wmeza.com
```

## Features

### 1. Authentication

- Custom credentials provider for DS API
- Secure HTTP-only cookies for token storage
- Automatic token management

### 2. API Proxy

- All API calls to DS API go through `/api/proxy/*`
- Automatic Authorization header injection
- Secure token handling

### 3. Protected Routes

- Middleware protects all routes except auth-related ones
- Automatic redirect to login for unauthenticated users

## Usage

### Making API Calls

Use the `useApi` hook to make authenticated API calls:

```typescript
import { useApi } from '@/hooks/useApi'

const MyComponent = () => {
  const { fetchApi, isAuthenticated, isLoading } = useApi()

  const fetchData = async () => {
    try {
      const data = await fetchApi('users/profile')
      console.log(data)
    } catch (error) {
      console.error('API Error:', error)
    }
  }

  if (isLoading) return <div>Loading...</div>
  if (!isAuthenticated) return <div>Please log in</div>

  return (
    <button onClick={fetchData}>
      Fetch Profile
    </button>
  )
}
```

### Session Management

Use NextAuth's `useSession` hook to access user data:

```typescript
import { useSession, signOut } from 'next-auth/react'

const UserProfile = () => {
  const { data: session } = useSession()

  return (
    <div>
      <p>Welcome, {session?.user?.name}!</p>
      <button onClick={() => signOut()}>
        Sign Out
      </button>
    </div>
  )
}
```

## API Endpoints

### Authentication

- `POST /api/auth/signin` - Sign in with credentials
- `POST /api/auth/signout` - Sign out
- `GET /api/auth/session` - Get current session

### Proxy

- `GET /api/proxy/*` - Proxy GET requests to DS API
- `POST /api/proxy/*` - Proxy POST requests to DS API
- `PUT /api/proxy/*` - Proxy PUT requests to DS API
- `DELETE /api/proxy/*` - Proxy DELETE requests to DS API
- `PATCH /api/proxy/*` - Proxy PATCH requests to DS API

## Security Features

1. **HTTP-Only Cookies**: Tokens are stored in secure HTTP-only cookies
2. **Automatic Token Injection**: All API calls automatically include the Authorization header
3. **Route Protection**: Middleware protects all routes except auth-related ones
4. **Secure Session Management**: NextAuth handles session security

## Login Flow

1. User enters username and password on `/login`
2. NextAuth sends credentials to DS API
3. DS API returns user data and tokens
4. Tokens are stored in secure cookies
5. User is redirected to the dashboard
6. All subsequent API calls use the stored token via the proxy
