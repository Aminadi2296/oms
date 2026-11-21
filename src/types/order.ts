// Types aligned with the OMS API (OpenAPI 0.1.0). Orders use camelCase; stages use snake_case.

// ─── Company Stage (configurable workflow column per company) ───────────────
export interface CompanyStage {
  id: number
  company_id: number
  name: string
  position: number
  is_final: boolean
}

// ─── Order (Pedido) ─────────────────────────────────────────────────────────
export type OrderPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export interface Order {
  id: number
  companyId: number
  orderNumber: string
  title: string
  description: string | null
  customerId: number
  stageId: number
  assignedToId: number | null
  priority: OrderPriority
  deadline: string | null
  position: number
  createdAt: string | null
  updatedAt: string | null
  completedAt: string | null

  // Derived on the client (the API does not return names)
  customerName?: string
  assignedToName?: string
}

// ─── Compact user (for assignment dropdown & team module) ──────────────────
export type UserRole = 'SUPERADMIN' | 'COMPANY_ADMIN' | 'EMPLOYEE' | string

export interface CompanyUser {
  id: number
  company_id?: number | null
  full_name: string
  email: string
  role: UserRole
  job_title?: string | null
  phone?: string | null
  is_active?: boolean
  created_at?: string | null
  active_orders_count?: number
  completed_orders_count?: number

  // Optional profile picture (whichever field the API returns)
  avatar_url?: string | null
  photo_url?: string | null
  avatar?: string | null
}
