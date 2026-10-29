'use client'

import React, { useEffect, useMemo, useState } from 'react'

import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'

import {
  Avatar,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Skeleton,
  Tab,
  Tabs,
  Typography
} from '@mui/material'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined'
import LanguageOutlinedIcon from '@mui/icons-material/LanguageOutlined'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'

import { ROUTES } from '@/constants/routes'
import { useOrders } from '@/hooks/useOrders'
import { useCompanyStages } from '@/hooks/useCompanyStages'

// Shape of a client returned by the API (extend as needed)
interface Client {
  id: number
  razon_social?: string
  nombre_comercial?: string
  tipo_documento?: string
  numero_fiscal?: string
  regimen_fiscal?: string
  region?: string
  ciudad?: string
  codigo_postal?: string
  direccion_fiscal?: string
  direccion_despacho?: string
  telefono_principal?: string
  correo_principal?: string
  sitio_web?: string
  contacto_nombre?: string
  contacto_cargo?: string
  contacto_telefono?: string
  contacto_correo?: string
  condicion_pago?: string
  limite_credito?: number | string
  moneda?: string
  notas?: string
  estatus?: string
  created_at?: string
  [key: string]: any
}

// ─────────────────────────── Helpers ────────────────────────────────────────
const camelToSnake = (s: string) => s.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`)

// The API may return camelCase or snake_case: expose both so the UI can rely on snake_case
function normalizeClient(raw: Record<string, any>): Client {
  const out: Record<string, any> = { ...raw }

  Object.keys(raw).forEach(k => {
    const snake = camelToSnake(k)

    if (out[snake] === undefined) out[snake] = raw[k]
  })

  return out as Client
}

function stringToColor(str: string, s = 55, l = 45) {
  let hash = 0

  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)

  return `hsl(${Math.abs(hash) % 360}, ${s}%, ${l}%)`
}

function getInitials(name?: string) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)

  return ((parts[0]?.[0] || '') + (parts.length > 1 ? parts[1][0] : '')).toUpperCase()
}

function formatDate(date?: string | null, withYear = true) {
  if (!date) return null
  const d = new Date(date)

  if (isNaN(d.getTime())) return null

  return d.toLocaleDateString('es', { day: 'numeric', month: 'short', ...(withYear ? { year: 'numeric' } : {}) })
}

function formatCredit(amount?: number | string, currency?: string) {
  if (amount === undefined || amount === null || amount === '') return null
  const n = Number(amount)

  if (isNaN(n)) return String(amount)

  // Intl only accepts ISO codes (USD, EUR…); the field is free text, so fall back gracefully
  if (currency && /^[A-Za-z]{3}$/.test(currency.trim())) {
    try {
      return new Intl.NumberFormat('es', { style: 'currency', currency: currency.trim().toUpperCase() }).format(n)
    } catch {
      /* fall through */
    }
  }

  return `${n.toLocaleString('es')}${currency ? ` ${currency}` : ''}`
}

const statusColor = (status?: string): 'success' | 'default' | 'error' | 'warning' => {
  switch ((status || '').toLowerCase()) {
    case 'activo':
      return 'success'
    case 'inactivo':
      return 'default'
    case 'bloqueado':
      return 'error'
    default:
      return 'warning'
  }
}

// ─────────────────────────── Small building blocks ──────────────────────────
const cardSx = {
  borderRadius: 3,
  border: '1px solid',
  borderColor: 'divider',
  boxShadow: 'none',
  bgcolor: 'background.paper'
} as const

function InfoItem({ label, value, wide }: { label: string; value?: React.ReactNode; wide?: boolean }) {
  const empty = value === undefined || value === null || value === ''

  return (
    <Box
      sx={{
        gridColumn: wide ? { xs: 'span 1', sm: 'span 2', xl: 'span 3' } : 'auto',
        pb: 1,
        borderBottom: '1px solid',
        borderColor: 'divider',
        minWidth: 0
      }}
    >
      <Typography variant='caption' color='text.disabled' sx={{ display: 'block', mb: 0.25 }}>
        {label}
      </Typography>
      <Typography
        variant='body2'
        sx={{ fontWeight: 500, color: empty ? 'text.disabled' : 'text.primary', wordBreak: 'break-word' }}
      >
        {empty ? '—' : value}
      </Typography>
    </Box>
  )
}

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
      <Typography variant='subtitle1' sx={{ fontWeight: 700 }}>
        {title}
      </Typography>
      {action}
    </Box>
  )
}

function ContactRow({ icon, children, href }: { icon: React.ReactNode; children: React.ReactNode; href?: string }) {
  const content = (
    <Typography
      variant='body2'
      sx={{
        color: href ? 'primary.main' : 'text.primary',
        wordBreak: 'break-word',
        '&:hover': href ? { textDecoration: 'underline' } : undefined
      }}
    >
      {children}
    </Typography>
  )

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, color: 'text.secondary' }}>
      {icon}
      {href ? (
        <Box component='a' href={href} sx={{ textDecoration: 'none' }}>
          {content}
        </Box>
      ) : (
        content
      )}
    </Box>
  )
}

// ─────────────────────────── Orders panel ───────────────────────────────────
function OrdersPanel({ clientId }: { clientId: number }) {
  const { orders, loading } = useOrders({ clientId })
  const { stages } = useCompanyStages()

  // Safety net: even if the API ignores the filter, only show this client's orders
  const clientOrders = useMemo(
    () =>
      orders
        .filter(o => Number(o.client_id) === clientId)
        .sort((a, b) => new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime()),
    [orders, clientId]
  )

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {[0, 1, 2].map(i => (
          <Skeleton key={i} variant='rounded' height={72} />
        ))}
      </Box>
    )
  }

  if (clientOrders.length === 0) {
    return (
      <Box sx={{ py: 6, textAlign: 'center', color: 'text.disabled' }}>
        <Inventory2OutlinedIcon sx={{ fontSize: 40, mb: 1 }} />
        <Typography variant='body1' sx={{ fontWeight: 600, color: 'text.secondary' }}>
          Este cliente aún no tiene pedidos
        </Typography>
        <Typography variant='body2'>Cuando se cree un pedido para este cliente aparecerá aquí.</Typography>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        position: 'relative',
        pl: 3.5,
        maxHeight: 520,
        overflowY: 'auto',
        pr: 0.5,
        // vertical timeline line
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 9,
          top: 12,
          bottom: 12,
          width: 2,
          bgcolor: 'divider'
        }
      }}
    >
      {clientOrders.map(order => {
        const stage = stages.find(s => s.id === order.current_stage_id)
        const done = !!stage?.is_final

        return (
          <Box key={order.id} sx={{ position: 'relative', mb: 1.5 }}>
            {/* timeline dot */}
            <Box
              sx={{
                position: 'absolute',
                left: -32,
                top: 22,
                width: 14,
                height: 14,
                borderRadius: '50%',
                bgcolor: 'background.paper',
                border: '3px solid',
                borderColor: done ? 'success.main' : 'primary.main'
              }}
            />
            <Paper
              elevation={0}
              sx={{
                p: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                flexWrap: 'wrap',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                transition: 'box-shadow .15s ease, border-color .15s ease',
                '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.10)', borderColor: 'primary.main' }
              }}
            >
              <Box sx={{ minWidth: 92 }}>
                <Typography variant='subtitle2' sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                  {formatDate(order.fecha_creacion, false) ?? '—'}
                </Typography>
                <Typography variant='caption' color='text.disabled'>
                  {order.fecha_creacion ? new Date(order.fecha_creacion).getFullYear() : ''}
                </Typography>
              </Box>

              <Divider orientation='vertical' flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />

              <Box sx={{ flex: 1, minWidth: 140 }}>
                <Typography variant='caption' color='text.disabled'>
                  Pedido
                </Typography>
                <Typography variant='body1' sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                  {order.numero}
                </Typography>
                {order.observaciones && (
                  <Typography variant='body2' color='text.secondary' noWrap sx={{ maxWidth: 360 }}>
                    {order.observaciones}
                  </Typography>
                )}
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                {order.category_name && (
                  <Chip
                    size='small'
                    label={order.category_name}
                    sx={{ bgcolor: stringToColor(order.category_name, 60, 48), color: '#fff', fontWeight: 600 }}
                  />
                )}
                {stage && (
                  <Chip size='small' variant='outlined' color={done ? 'success' : 'primary'} label={stage.name} />
                )}
              </Box>
            </Paper>
          </Box>
        )
      })}
    </Box>
  )
}

// ─────────────────────────── Page ───────────────────────────────────────────
export default function ClientDetailPage() {
  const router = useRouter()
  const { id } = useParams() as { id: string }

  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState(0)

  const clientId = Number(id)
  const { orders } = useOrders({ clientId })
  const { stages } = useCompanyStages()

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const res = await fetch(`/api/proxy/clients/${id}`)

        if (!res.ok) {
          throw new Error(`Error ${res.status}`)
        }

        const data = await res.json()

        // API may return { data: client } or the client directly
        setClient(normalizeClient(data.data || data))
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchClient()
  }, [id])

  // Order stats shown in the profile card
  const stats = useMemo(() => {
    const mine = orders.filter(o => Number(o.client_id) === clientId)
    const finalIds = new Set(stages.filter(s => s.is_final).map(s => s.id))
    const finished = mine.filter(o => o.current_stage_id !== null && finalIds.has(o.current_stage_id)).length

    return { active: mine.length - finished, finished }
  }, [orders, stages, clientId])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error || !client) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography color='error' sx={{ mb: 2 }}>
          {error ? `Error al cargar el cliente: ${error}` : 'No hay datos del cliente.'}
        </Typography>
        <Button variant='outlined' onClick={() => router.push(ROUTES.CLIENTS.INDEX)}>
          Volver a la lista
        </Button>
      </Box>
    )
  }

  const displayName = client.razon_social || client.nombre_comercial || `Cliente #${id}`
  const location = [client.ciudad, client.region].filter(Boolean).join(', ')

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant='h4' sx={{ fontWeight: 700, mb: 0.5 }}>
          {displayName}
        </Typography>
        <Breadcrumbs separator={<NavigateNextIcon fontSize='small' />}>
          <Typography
            component={Link}
            href={ROUTES.CLIENTS.INDEX}
            color='primary'
            variant='body2'
            sx={{ textDecoration: 'none' }}
          >
            Clientes
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            {displayName}
          </Typography>
        </Breadcrumbs>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: 'minmax(0,1fr)', lg: 'minmax(0,1fr) 340px' },
          alignItems: 'start'
        }}
      >
        {/* ───────── Left column ───────── */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
          {/* Profile + data */}
          <Paper sx={{ ...cardSx, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '280px minmax(0,1fr)' } }}>
            <Box
              sx={{
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                borderRight: { md: '1px solid' },
                borderBottom: { xs: '1px solid', md: 'none' },
                borderColor: 'divider'
              }}
            >
              <Avatar
                sx={{
                  width: 84,
                  height: 84,
                  fontSize: 30,
                  fontWeight: 700,
                  mb: 1.5,
                  bgcolor: stringToColor(displayName)
                }}
              >
                {getInitials(displayName)}
              </Avatar>
              <Typography variant='h6' sx={{ fontWeight: 700, lineHeight: 1.25 }}>
                {displayName}
              </Typography>
              {client.nombre_comercial && client.nombre_comercial !== displayName && (
                <Typography variant='body2' color='text.secondary'>
                  {client.nombre_comercial}
                </Typography>
              )}
              {client.correo_principal && (
                <Typography variant='caption' color='text.disabled' sx={{ mt: 0.5, wordBreak: 'break-all' }}>
                  {client.correo_principal}
                </Typography>
              )}
              {client.estatus && (
                <Chip size='small' color={statusColor(client.estatus)} label={client.estatus} sx={{ mt: 1.5 }} />
              )}

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, my: 2.5 }}>
                <Box>
                  <Typography variant='h6' sx={{ fontWeight: 700, lineHeight: 1 }}>
                    {stats.active}
                  </Typography>
                  <Typography variant='caption' color='text.disabled'>
                    En curso
                  </Typography>
                </Box>
                <Divider orientation='vertical' flexItem />
                <Box>
                  <Typography variant='h6' sx={{ fontWeight: 700, lineHeight: 1 }}>
                    {stats.finished}
                  </Typography>
                  <Typography variant='caption' color='text.disabled'>
                    Finalizados
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}>
                <Button
                  variant='outlined'
                  fullWidth
                  startIcon={<EmailOutlinedIcon />}
                  disabled={!client.correo_principal}
                  href={client.correo_principal ? `mailto:${client.correo_principal}` : undefined}
                >
                  Enviar correo
                </Button>
                <Button
                  variant='text'
                  fullWidth
                  startIcon={<PhoneOutlinedIcon />}
                  disabled={!client.telefono_principal}
                  href={client.telefono_principal ? `tel:${client.telefono_principal}` : undefined}
                >
                  Llamar
                </Button>
              </Box>
            </Box>

            <Box sx={{ p: 3 }}>
              <SectionHeader title='Información del cliente' />
              <Box
                sx={{
                  display: 'grid',
                  gap: 2.5,
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0,1fr))', xl: 'repeat(3, minmax(0,1fr))' }
                }}
              >
                <InfoItem label='Tipo de documento' value={client.tipo_documento} />
                <InfoItem label='Número fiscal' value={client.numero_fiscal} />
                <InfoItem label='Régimen fiscal' value={client.regimen_fiscal} />
                <InfoItem label='Teléfono principal' value={client.telefono_principal} />
                <InfoItem label='Correo principal' value={client.correo_principal} />
                <InfoItem
                  label='Sitio web'
                  value={
                    client.sitio_web ? (
                      <Box
                        component='a'
                        href={/^https?:\/\//.test(client.sitio_web) ? client.sitio_web : `https://${client.sitio_web}`}
                        target='_blank'
                        rel='noopener noreferrer'
                        sx={{
                          color: 'primary.main',
                          textDecoration: 'none',
                          '&:hover': { textDecoration: 'underline' }
                        }}
                      >
                        {client.sitio_web}
                      </Box>
                    ) : null
                  }
                />
                <InfoItem label='Ciudad / Región' value={location} />
                <InfoItem label='Código postal' value={client.codigo_postal} />
                <InfoItem label='Cliente desde' value={formatDate(client.created_at)} />
                <InfoItem label='Dirección fiscal' value={client.direccion_fiscal} wide />
                <InfoItem label='Dirección de despacho' value={client.direccion_despacho} wide />
              </Box>
            </Box>
          </Paper>

          {/* Tabs: orders / billing */}
          <Paper sx={{ ...cardSx, p: 3 }}>
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              sx={{
                mb: 3,
                minHeight: 40,
                bgcolor: 'action.hover',
                borderRadius: 2,
                p: 0.5,
                width: 'fit-content',
                '& .MuiTabs-indicator': { display: 'none' },
                '& .MuiTab-root': {
                  minHeight: 36,
                  borderRadius: 1.5,
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 2.5
                },
                '& .Mui-selected': { bgcolor: 'background.paper', boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }
              }}
            >
              <Tab
                label={`Pedidos${orders.length ? ` (${orders.filter(o => Number(o.client_id) === clientId).length})` : ''}`}
              />
              <Tab label='Facturación' />
            </Tabs>

            {tab === 0 && <OrdersPanel clientId={clientId} />}

            {tab === 1 && (
              <Box
                sx={{
                  display: 'grid',
                  gap: 2.5,
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0,1fr))', xl: 'repeat(3, minmax(0,1fr))' }
                }}
              >
                <InfoItem label='Condición de pago' value={client.condicion_pago} />
                <InfoItem label='Límite de crédito' value={formatCredit(client.limite_credito, client.moneda)} />
                <InfoItem label='Moneda preferida' value={client.moneda} />
              </Box>
            )}
          </Paper>
        </Box>

        {/* ───────── Right column ───────── */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
          <Paper sx={{ ...cardSx, p: 3 }}>
            <SectionHeader title='Contacto principal' />
            {client.contacto_nombre || client.contacto_correo || client.contacto_telefono ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar sx={{ bgcolor: stringToColor(client.contacto_nombre || 'contacto'), width: 40, height: 40 }}>
                    {client.contacto_nombre ? getInitials(client.contacto_nombre) : <PersonOutlineIcon />}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant='body2' sx={{ fontWeight: 700 }}>
                      {client.contacto_nombre || 'Sin nombre'}
                    </Typography>
                    {client.contacto_cargo && (
                      <Typography variant='caption' color='text.secondary'>
                        {client.contacto_cargo}
                      </Typography>
                    )}
                  </Box>
                </Box>
                {client.contacto_telefono && (
                  <ContactRow icon={<PhoneOutlinedIcon fontSize='small' />} href={`tel:${client.contacto_telefono}`}>
                    {client.contacto_telefono}
                  </ContactRow>
                )}
                {client.contacto_correo && (
                  <ContactRow icon={<EmailOutlinedIcon fontSize='small' />} href={`mailto:${client.contacto_correo}`}>
                    {client.contacto_correo}
                  </ContactRow>
                )}
                {client.sitio_web && (
                  <ContactRow icon={<LanguageOutlinedIcon fontSize='small' />}>{client.sitio_web}</ContactRow>
                )}
              </Box>
            ) : (
              <Typography variant='body2' color='text.disabled'>
                No hay un contacto registrado.
              </Typography>
            )}
          </Paper>

          <Paper sx={{ ...cardSx, p: 3 }}>
            <SectionHeader title='Notas' />
            {client.notas ? (
              <Box sx={{ bgcolor: 'action.hover', borderRadius: 2, p: 2 }}>
                <Typography variant='body2' sx={{ whiteSpace: 'pre-line' }}>
                  {client.notas}
                </Typography>
              </Box>
            ) : (
              <Typography variant='body2' color='text.disabled'>
                Sin notas para este cliente.
              </Typography>
            )}
          </Paper>
        </Box>
      </Box>
    </Box>
  )
}
