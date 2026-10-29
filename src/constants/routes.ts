export const API_PROXY_PATH = '/api/proxy'

export const API_ROUTES = {
  HEALTH: 'health',
  AUTH: {
    LOGIN: 'auth/login',
    LOGOUT: 'auth/logout',
    REGISTER: 'auth/register',
    REFRESH: 'auth/refresh',
    ME: 'auth/me',
    CHANGE_PASSWORD: 'auth/change-password',
    CSRF_TOKEN: 'auth/csrf_token',
    CSRF_VALIDATE: 'auth/csrf_validate',
    CSRF_REVOKE: 'auth/csrf_revoke'
  },
  CLIENTS: {
    LIST: 'clients',
    GET: () => 'clients/$id',
    SEARCH: 'clients/search',
    UPDATE: () => 'clients/$id',
    DELETE: () => 'clients/$id',
    POST: 'clients',
    CREATE_BULK: 'clients/bulk-upload'
  },
  ORDERS: {
    LIST: 'orders',
    GET: (id: string | number) => `orders/${id}`,
    CREATE: 'orders',
    UPDATE: (id: string | number) => `orders/${id}`,
    MOVE_STAGE: (id: string | number) => `orders/${id}/stage`,
    ASSIGN: (id: string | number) => `orders/${id}/assign`
  },
  COMPANIES: {
    STAGES: (companyId: number) => `companies/${companyId}/stages`,
    STAGE: (companyId: number, stageId: number) => `companies/${companyId}/stages/${stageId}`,
    CATEGORIES: (companyId: number) => `companies/${companyId}/categories`,
    USERS: (companyId: number) => `companies/${companyId}/users`
  }
}

export const ROUTES = {
  HOME: '/home',
  LOGIN: '/login',
  CLIENTS: {
    INDEX: '/clients',
    CREATE: '/clients/create',
    CREATE_BULK: '/clients/create-bulk',

    // Fixed placeholder to correctly interpolate the client id
    DETAIL: (id: string | number) => `/clients/${id}`
  },
  ORDERS: {
    INDEX: '/orders',
    STAGES: '/orders/stages',
    CREATE: '/orders/create',
    DETAIL: (id: string | number) => `/orders/${id}`
  },
  ABOUT: '/about'
}
