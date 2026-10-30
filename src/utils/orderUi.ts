import type { CompanyUser, Order, OrderPriority } from '@/types/order'
import type { Client } from '@/types/client'

// ─── Colors / initials ──────────────────────────────────────────────────────

/** Deterministic color from a string (avatar fallback). */
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

// ─── Priority ───────────────────────────────────────────────────────────────

export const PRIORITIES: OrderPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']

export const PRIORITY_META: Record<OrderPriority, { label: string; color: string }> = {
  LOW: { label: 'Baja', color: '#90a4ae' },
  MEDIUM: { label: 'Media', color: '#1e88e5' },
  HIGH: { label: 'Alta', color: '#fb8c00' },
  URGENT: { label: 'Urgente', color: '#e53935' }
}

export const getPriorityMeta = (priority?: string | null) =>
  PRIORITY_META[(priority as OrderPriority) ?? 'MEDIUM'] ?? PRIORITY_META.MEDIUM

// ─── Dates ──────────────────────────────────────────────────────────────────

export function formatShortDate(date?: string | null) {
  if (!date) return null
  const d = new Date(date)

  if (isNaN(d.getTime())) return null

  return d.toLocaleDateString('es', { day: 'numeric', month: 'short' })
}

export function formatLongDate(date?: string | null) {
  if (!date) return null
  const d = new Date(date)

  if (isNaN(d.getTime())) return null

  return d.toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })
}

/** A deadline is overdue when it is in the past and the order is not completed. */
export function isOverdue(deadline?: string | null, completedAt?: string | null) {
  if (!deadline || completedAt) return false
  const t = new Date(deadline).getTime()

  return !isNaN(t) && t < Date.now()
}

/** "2026-11-05" (date input) -> ISO date-time at the end of that local day. */
export function dateInputToISO(value: string) {
  return new Date(`${value}T23:59:00`).toISOString()
}

/** ISO date-time -> "YYYY-MM-DD" in local time (for <input type="date">). */
export function isoToDateInput(iso?: string | null) {
  if (!iso) return ''
  const d = new Date(iso)

  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// ─── Order ordering / completion ────────────────────────────────────────────

export const POSITION_STEP = 1024

/**
 * Integer position between two neighbours.
 * Returns null when there is no room left (caller must renumber the column).
 */
export function positionBetween(prev?: number, next?: number): number | null {
  if (prev === undefined && next === undefined) return POSITION_STEP
  if (prev === undefined) return next! > 1 ? Math.floor(next! / 2) : null
  if (next === undefined) return prev + POSITION_STEP

  return next - prev > 1 ? Math.floor((prev + next) / 2) : null
}

/** completedAt change needed when an order enters/leaves a final stage. */
export function completionPatch(order: Pick<Order, 'completedAt'>, targetIsFinal: boolean) {
  if (targetIsFinal && !order.completedAt) return { completedAt: new Date().toISOString() }
  if (!targetIsFinal && order.completedAt) return { completedAt: null }

  return {}
}

// ─── Users ──────────────────────────────────────────────────────────────────

// Placeholder avatar (same one used in the navbar user dropdown) until the API returns real photos
export const DEFAULT_AVATAR = '/images/avatars/1.png'

export function getUserAvatarUrl(user?: CompanyUser) {
  return user?.avatar_url || user?.photo_url || user?.avatar || DEFAULT_AVATAR
}

/** API roles: SUPERADMIN | COMPANY_ADMIN | EMPLOYEE */
export const isAdminRole = (role?: string) => role === 'SUPERADMIN' || role === 'COMPANY_ADMIN'

export const ROLE_LABELS: Record<string, string> = {
  SUPERADMIN: 'Superadmin',
  COMPANY_ADMIN: 'Administrador',
  EMPLOYEE: 'Empleado'
}

// ─── Clients ────────────────────────────────────────────────────────────────

/** Display name of a client. The API returns camelCase. */
export function getClientName(client: Client | Record<string, any>) {
  const c = client as Record<string, any>
  const legacy = [c.first_name ?? c.firstName, c.last_name ?? c.lastName].filter(Boolean).join(' ')

  return c.razon_social ?? c.razonSocial ?? c.nombre_comercial ?? c.nombreComercial ?? (legacy || `Cliente #${c.id}`)
}

export function getClientTaxId(client: Client | Record<string, any>): string | undefined {
  const c = client as Record<string, any>

  return c.numero_fiscal ?? c.numeroFiscal ?? c.document_number ?? c.documentNumber ?? undefined
}
