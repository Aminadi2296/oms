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

// ─── Compact user (for assignment dropdown) ─────────────────────────────────
export interface CompanyUser {
  id: number
  full_name: string
  email: string
  role: string
  is_active?: boolean
  // Optional profile picture (whichever field the API returns)
  avatar_url?: string | null
  photo_url?: string | null
  avatar?: string | null
}
