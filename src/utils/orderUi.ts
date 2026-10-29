import type { CompanyUser } from '@/types/order'
import type { Client } from '@/types/client'

// ─── Colors / initials (shared by the orders board, dialogs and client views) ───

/** Deterministic color from a string (category labels, avatar fallback). */
export function stringToColor(str: string, s = 55, l = 45) {
  let hash = 0

  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)

  return `hsl(${Math.abs(hash) % 360}, ${s}%, ${l}%)`
}

export function getInitials(name?: string) {
  if (!name) return ''
  const parts = name.trim().split(/\s+/)

  return ((parts[0]?.[0] || '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}

/** Accent color of an order category (neutral when it has none). */
export const getCategoryAccent = (categoryName?: string | null) =>
  categoryName ? stringToColor(categoryName, 65, 50) : 'text.disabled'

// ─── Users ──────────────────────────────────────────────────────────────────

// Placeholder avatar (same one used in the navbar user dropdown) until the API returns real photos
export const DEFAULT_AVATAR = '/images/avatars/1.png'

export function getUserAvatarUrl(user?: CompanyUser) {
  return user?.avatar_url || user?.photo_url || user?.avatar || DEFAULT_AVATAR
}

// ─── Clients ────────────────────────────────────────────────────────────────

/** Display name of a client. The API may return camelCase or snake_case. */
export function getClientName(client: Client | Record<string, any>) {
  const c = client as Record<string, any>
  const legacy = [c.first_name ?? c.firstName, c.last_name ?? c.lastName].filter(Boolean).join(' ')

  return c.razon_social ?? c.razonSocial ?? c.nombre_comercial ?? c.nombreComercial ?? (legacy || `Cliente #${c.id}`)
}

export function getClientTaxId(client: Client | Record<string, any>): string | undefined {
  const c = client as Record<string, any>

  return c.numero_fiscal ?? c.numeroFiscal ?? c.document_number ?? c.documentNumber ?? undefined
}
