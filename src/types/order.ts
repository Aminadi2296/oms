// ─── Company Stage (etapa configurable por empresa) ─────────────────────────
export interface CompanyStage {
  id: number
  company_id: number
  name: string
  position: number
  is_final: boolean
}

// ─── Order Category ─────────────────────────────────────────────────────────
export interface OrderCategory {
  id: number
  company_id: number
  name: string
}

// ─── Order (Pedido) ─────────────────────────────────────────────────────────
export interface Order {
  id: number
  numero: string
  client_id: number | null
  company_id: number
  fecha_creacion: string
  observaciones: string | null
  categoria_id: number | null
  notes: string | null
  photo_url: string | null
  total: number | null
  current_stage_id: number | null
  assigned_user_id: number | null

  // Populated relations (from API, may be absent)
  client_name?: string
  assigned_user_name?: string
  stage_name?: string
  category_name?: string

  // camelCase alternatives from API (normalised on fetch)
  [key: string]: any
}

// ─── Compact user (for assignment dropdown) ─────────────────────────────────
export interface CompanyUser {
  id: number
  full_name: string
  email: string
  role: string
  // Optional profile picture (whichever field the API returns)
  avatar_url?: string | null
  photo_url?: string | null
  avatar?: string | null
}
