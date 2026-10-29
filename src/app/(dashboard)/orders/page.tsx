'use client'

import React, { useState, useCallback, useMemo } from 'react'

import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Chip,
  Avatar,
  Collapse,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  FormHelperText
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import SettingsIcon from '@mui/icons-material/Settings'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import SubjectIcon from '@mui/icons-material/Subject'
import StickyNote2OutlinedIcon from '@mui/icons-material/StickyNote2Outlined'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

import {
  DndContext,
  DragOverlay,
  closestCorners,
  useDroppable,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { useCompanyStages } from '@/hooks/useCompanyStages'
import { useOrders } from '@/hooks/useOrders'
import { useCompanyUsers } from '@/hooks/useCompanyUsers'
import { useOrderCategories } from '@/hooks/useOrderCategories'
import { useApi } from '@/hooks/useApi'
import { useSnackbar } from '@/hooks/useSnackbar'
import { ROUTES } from '@/constants/routes'
import type { Order, CompanyStage, CompanyUser } from '@/types/order'

// ─────────────────────────── Helpers ────────────────────────────────────────
// Deterministic color from a string (category labels, avatar fallback)
function stringToColor(str: string, s = 55, l = 45) {
  let hash = 0

  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)

  return `hsl(${Math.abs(hash) % 360}, ${s}%, ${l}%)`
}

function getInitials(name?: string) {
  if (!name) return ''
  const parts = name.trim().split(/\s+/)

  return ((parts[0]?.[0] || '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}

function formatShortDate(date?: string | null) {
  if (!date) return null
  const d = new Date(date)

  if (isNaN(d.getTime())) return null

  return d.toLocaleDateString('es', { day: 'numeric', month: 'short' })
}

// Placeholder avatar (same one used in the navbar user dropdown) until the API returns real photos
const DEFAULT_AVATAR = '/images/avatars/1.png'

function getUserAvatarUrl(user?: CompanyUser) {
  return user?.avatar_url || user?.photo_url || user?.avatar || DEFAULT_AVATAR
}

// ─────────────────────────── Assignee Avatar ────────────────────────────────
function AssigneeAvatar({ user, size = 28 }: { user?: CompanyUser; size?: number }) {
  if (!user) {
    return (
      <Tooltip title='Sin asignar'>
        <Avatar
          sx={{
            width: size,
            height: size,
            bgcolor: 'transparent',
            color: 'text.disabled',
            border: '1px dashed',
            borderColor: 'text.disabled'
          }}
        >
          <PersonOutlineIcon sx={{ fontSize: size * 0.6 }} />
        </Avatar>
      </Tooltip>
    )
  }

  return (
    <Tooltip title={user.full_name}>
      <Avatar
        src={getUserAvatarUrl(user)}
        alt={user.full_name}
        sx={{
          width: size,
          height: size,
          fontSize: size * 0.42,
          fontWeight: 600,
          bgcolor: stringToColor(user.full_name || String(user.id))
        }}
      >
        {getInitials(user.full_name)}
      </Avatar>
    </Tooltip>
  )
}

// ─────────────────────────── Order Card ─────────────────────────────────────
interface OrderCardProps {
  order: Order
  onClick: (order: Order) => void
  users: CompanyUser[]
}

const cardBaseSx = {
  p: 1.5,
  mb: 1.25,
  borderRadius: 2,
  bgcolor: 'background.paper',
  border: '1px solid',
  borderColor: 'divider',
  boxShadow: '0 1px 2px rgba(0,0,0,0.08)'
} as const

function SortableOrderCard({ order, onClick, users }: OrderCardProps) {
  const [hovered, setHovered] = useState(false)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `order-${order.id}`
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1
  }

  const assignedUser = users.find(u => u.id === order.assigned_user_id)
  const dateLabel = formatShortDate(order.fecha_creacion)
  const expanded = hovered && !isDragging
  const hasDetails = !!(order.observaciones || order.notes)

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      elevation={0}
      {...attributes}
      {...listeners}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onClick(order)}
      sx={{
        ...cardBaseSx,
        cursor: 'pointer',
        touchAction: 'manipulation',
        transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
        '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.14)', borderColor: 'primary.main' },
        '&:active': { cursor: 'grabbing' },
        '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 }
      }}
    >
      {/* Category label */}
      {order.category_name && (
        <Box
          sx={{
            display: 'inline-block',
            px: 1,
            py: 0.125,
            mb: 0.75,
            borderRadius: 1,
            bgcolor: stringToColor(order.category_name, 60, 48),
            color: '#fff',
            fontSize: 11,
            fontWeight: 600,
            lineHeight: 1.6
          }}
        >
          {order.category_name}
        </Box>
      )}

      {/* Title */}
      <Typography variant='subtitle2' sx={{ fontWeight: 700, lineHeight: 1.3 }}>
        {order.numero}
      </Typography>
      {order.client_name && (
        <Typography variant='body2' color='text.secondary' noWrap>
          {order.client_name}
        </Typography>
      )}

      {/* Expandable details on hover */}
      <Collapse in={expanded && hasDetails} timeout={180} unmountOnExit>
        <Box sx={{ mt: 1, pt: 1, borderTop: '1px dashed', borderColor: 'divider' }}>
          {order.observaciones && (
            <Box sx={{ mb: order.notes ? 1 : 0 }}>
              <Typography variant='caption' color='text.disabled' sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                Observaciones
              </Typography>
              <Typography
                variant='body2'
                sx={{
                  display: '-webkit-box',
                  WebkitLineClamp: 4,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  whiteSpace: 'pre-line'
                }}
              >
                {order.observaciones}
              </Typography>
            </Box>
          )}
          {order.notes && (
            <Box>
              <Typography variant='caption' color='text.disabled' sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                Notas
              </Typography>
              <Typography
                variant='body2'
                color='text.secondary'
                sx={{
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  whiteSpace: 'pre-line'
                }}
              >
                {order.notes}
              </Typography>
            </Box>
          )}
        </Box>
      </Collapse>

      {/* Footer: meta icons + assignee */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1.25 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, color: 'text.secondary' }}>
          {order.observaciones && (
            <Tooltip title='Tiene observaciones'>
              <SubjectIcon sx={{ fontSize: 16 }} />
            </Tooltip>
          )}
          {order.notes && (
            <Tooltip title='Tiene notas'>
              <StickyNote2OutlinedIcon sx={{ fontSize: 16 }} />
            </Tooltip>
          )}
          {order.photo_url && (
            <Tooltip title='Tiene foto adjunta'>
              <ImageOutlinedIcon sx={{ fontSize: 16 }} />
            </Tooltip>
          )}
          {dateLabel && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <AccessTimeIcon sx={{ fontSize: 15 }} />
              <Typography variant='caption'>{dateLabel}</Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          {expanded && assignedUser && (
            <Typography variant='caption' color='text.secondary' noWrap sx={{ maxWidth: 110 }}>
              {assignedUser.full_name}
            </Typography>
          )}
          <AssigneeAvatar user={assignedUser} />
        </Box>
      </Box>
    </Paper>
  )
}

// Simple card for drag overlay (no sortable hooks)
function OrderCardOverlay({ order, users }: { order: Order; users: CompanyUser[] }) {
  const assignedUser = users.find(u => u.id === order.assigned_user_id)

  return (
    <Paper
      elevation={0}
      sx={{
        ...cardBaseSx,
        width: 280,
        cursor: 'grabbing',
        borderColor: 'primary.main',
        boxShadow: '0 12px 28px rgba(0,0,0,0.25)',
        transform: 'rotate(2.5deg)'
      }}
    >
      <Typography variant='subtitle2' sx={{ fontWeight: 700 }}>
        {order.numero}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
        <Typography variant='body2' color='text.secondary' noWrap>
          {order.client_name || ' '}
        </Typography>
        <AssigneeAvatar user={assignedUser} size={24} />
      </Box>
    </Paper>
  )
}

// ─────────────────────────── Stage Column ───────────────────────────────────
interface StageColumnProps {
  stage: CompanyStage
  orders: Order[]
  onCardClick: (order: Order) => void
  users: CompanyUser[]
}

function StageColumn({ stage, orders, onCardClick, users }: StageColumnProps) {
  const orderIds = useMemo(() => orders.map(o => `order-${o.id}`), [orders])

  // Makes the whole column a valid drop target (needed to drop into empty columns)
  const { setNodeRef, isOver } = useDroppable({ id: `stage-${stage.id}` })

  return (
    <Box
      sx={{
        minWidth: 280,
        maxWidth: 320,
        flex: '0 0 300px',
        bgcolor: isOver ? 'action.selected' : 'action.hover',
        borderRadius: 3,
        p: 1.5,
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 'calc(100vh - 200px)',
        border: '1px solid',
        borderColor: isOver ? 'primary.main' : 'divider',
        transition: 'background-color 0.15s ease, border-color 0.15s ease'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, px: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          <Typography variant='subtitle1' noWrap sx={{ fontWeight: 700 }}>
            {stage.name}
          </Typography>
          <Chip label={orders.length} size='small' sx={{ height: 20, fontWeight: 600 }} />
        </Box>
        {stage.is_final && <Chip label='Final' size='small' color='success' />}
      </Box>

      <Box ref={setNodeRef} sx={{ flex: 1, overflowY: 'auto', minHeight: 100, px: 0.25 }}>
        <SortableContext items={orderIds} strategy={verticalListSortingStrategy}>
          {orders.map(order => (
            <SortableOrderCard key={order.id} order={order} onClick={onCardClick} users={users} />
          ))}
        </SortableContext>
        {orders.length === 0 && (
          <Box
            sx={{
              mt: 1,
              py: 4,
              textAlign: 'center',
              border: '1px dashed',
              borderColor: isOver ? 'primary.main' : 'divider',
              borderRadius: 2
            }}
          >
            <Typography variant='body2' color='text.disabled'>
              {isOver ? 'Soltar aquí' : 'Sin pedidos'}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  )
}

// ─────────────────────────── Create Order Dialog ────────────────────────────
interface CreateOrderDialogProps {
  open: boolean
  onClose: () => void
  onCreated: () => void
  stages: CompanyStage[]
  companyId: number | null
}

function CreateOrderDialog({ open, onClose, onCreated, stages, companyId }: CreateOrderDialogProps) {
  const { fetchApi } = useApi()
  const { showSuccess, showError } = useSnackbar()
  const { categories, loading: categoriesLoading, createCategory } = useOrderCategories(companyId)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    client_id: '',
    categoria_id: '',
    observaciones: '',
    notes: '',
    current_stage_id: ''
  })

  const [addingCategory, setAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [savingCategory, setSavingCategory] = useState(false)

  const handleAddCategory = async () => {
    const name = newCategoryName.trim()

    if (!name) return

    if (categories.some(c => c.name.trim().toLowerCase() === name.toLowerCase())) {
      showError('Ya existe una categoría con ese nombre')

      return
    }

    setSavingCategory(true)
    try {
      const created = await createCategory(name)

      if (created) setForm(f => ({ ...f, categoria_id: created.id.toString() }))
      showSuccess('Categoría creada')
      setNewCategoryName('')
      setAddingCategory(false)
    } catch (err: any) {
      showError(err?.message || 'Error al crear categoría')
    } finally {
      setSavingCategory(false)
    }
  }

  const handleCreate = async () => {
    if (!companyId) return
    setSubmitting(true)
    try {
      const body: any = {
        observaciones: form.observaciones || null,
        notes: form.notes || null
      }

      if (form.client_id) body.client_id = Number(form.client_id)
      if (form.categoria_id) body.categoria_id = Number(form.categoria_id)
      if (form.current_stage_id) {
        body.current_stage_id = Number(form.current_stage_id)
      } else if (stages.length > 0) {
        body.current_stage_id = stages[0].id
      }

      await fetchApi('orders', { method: 'POST', body })
      showSuccess('Pedido creado exitosamente')
      setForm({ client_id: '', categoria_id: '', observaciones: '', notes: '', current_stage_id: '' })
      onCreated()
      onClose()
    } catch (err: any) {
      showError(err?.message || 'Error al crear pedido')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='sm'>
      <DialogTitle sx={{ fontWeight: 700 }}>Nuevo Pedido</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
        <TextField
          label='ID del Cliente (opcional)'
          type='number'
          value={form.client_id}
          onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}
          fullWidth
          margin='dense'
        />
        <FormControl fullWidth margin='dense' disabled={categoriesLoading}>
          <InputLabel>Categoría</InputLabel>
          <Select
            value={form.categoria_id}
            label='Categoría'
            onChange={e => setForm(f => ({ ...f, categoria_id: e.target.value as string }))}
          >
            <MenuItem value=''>Sin categoría</MenuItem>
            {categories.map(c => (
              <MenuItem key={c.id} value={c.id.toString()}>
                {c.name}
              </MenuItem>
            ))}
          </Select>
          {!categoriesLoading && categories.length === 0 && (
            <FormHelperText>Aún no hay categorías creadas</FormHelperText>
          )}
        </FormControl>

        {addingCategory ? (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: -1 }}>
            <TextField
              autoFocus
              size='small'
              label='Nueva categoría'
              value={newCategoryName}
              onChange={e => setNewCategoryName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddCategory()
                }

                if (e.key === 'Escape') {
                  e.stopPropagation()
                  setAddingCategory(false)
                  setNewCategoryName('')
                }
              }}
              disabled={savingCategory}
              fullWidth
            />
            <Button
              variant='contained'
              onClick={handleAddCategory}
              disabled={savingCategory || !newCategoryName.trim()}
              sx={{ whiteSpace: 'nowrap', minWidth: 96 }}
            >
              {savingCategory ? <CircularProgress size={20} /> : 'Agregar'}
            </Button>
            <Button
              onClick={() => {
                setAddingCategory(false)
                setNewCategoryName('')
              }}
              disabled={savingCategory}
            >
              Cancelar
            </Button>
          </Box>
        ) : (
          <Box sx={{ mt: -1 }}>
            <Button size='small' startIcon={<AddIcon />} onClick={() => setAddingCategory(true)}>
              Nueva categoría
            </Button>
          </Box>
        )}
        <FormControl fullWidth margin='dense'>
          <InputLabel>Etapa Inicial</InputLabel>
          <Select
            value={form.current_stage_id || (stages[0]?.id?.toString() ?? '')}
            label='Etapa Inicial'
            onChange={e => setForm(f => ({ ...f, current_stage_id: e.target.value as string }))}
          >
            {stages.map(s => (
              <MenuItem key={s.id} value={s.id.toString()}>
                {s.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label='Observaciones'
          multiline
          rows={3}
          value={form.observaciones}
          onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))}
          fullWidth
          margin='dense'
        />
        <TextField
          label='Notas'
          multiline
          rows={2}
          value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          fullWidth
          margin='dense'
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancelar
        </Button>
        <Button variant='contained' onClick={handleCreate} disabled={submitting}>
          {submitting ? <CircularProgress size={20} /> : 'Crear Pedido'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ─────────────────────────── Order Detail Modal ─────────────────────────────
interface OrderDetailModalProps {
  order: Order | null
  open: boolean
  onClose: () => void
  onUpdated: () => void
  stages: CompanyStage[]
  users: CompanyUser[]
  companyId: number | null
  userRole?: string
}

function OrderDetailModal({
  order,
  open,
  onClose,
  onUpdated,
  stages,
  users,
  companyId,
  userRole
}: OrderDetailModalProps) {
  const { fetchApi } = useApi()
  const { showSuccess, showError } = useSnackbar()
  const [saving, setSaving] = useState(false)

  const [observaciones, setObservaciones] = useState('')
  const [notes, setNotes] = useState('')
  const [assignedUserId, setAssignedUserId] = useState<string>('')
  const [total, setTotal] = useState<string>('')

  // Sync local state when order changes
  React.useEffect(() => {
    if (order) {
      setObservaciones(order.observaciones || '')
      setNotes(order.notes || '')
      setAssignedUserId(order.assigned_user_id?.toString() || '')
      setTotal(order.total?.toString() || '')
    }
  }, [order])

  const isAdmin = userRole === 'superadmin' || userRole === 'adminCompany'

  const handleSave = async () => {
    if (!order) return
    setSaving(true)
    try {
      const body: any = {
        observaciones: observaciones || null,
        notes: notes || null
      }

      if (isAdmin && total) {
        body.total = parseFloat(total)
      }

      await fetchApi(`orders/${order.id}`, { method: 'PATCH', body })

      // Handle assignment separately
      if (assignedUserId !== (order.assigned_user_id?.toString() || '')) {
        if (assignedUserId) {
          await fetchApi(`orders/${order.id}/assign`, { method: 'POST', body: { user_id: Number(assignedUserId) } })
        }
      }

      showSuccess('Pedido actualizado')
      onUpdated()
      onClose()
    } catch (err: any) {
      showError(err?.message || 'Error al actualizar pedido')
    } finally {
      setSaving(false)
    }
  }

  if (!order) return null

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='sm'>
      <DialogTitle sx={{ fontWeight: 700 }}>Pedido {order.numero}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
        <Typography variant='body2' color='text.secondary'>
          Fecha de creación: {order.fecha_creacion ? new Date(order.fecha_creacion).toLocaleDateString('es') : '-'}
        </Typography>

        {order.client_name && (
          <Typography variant='body2'>
            <strong>Cliente:</strong> {order.client_name}
          </Typography>
        )}

        <TextField
          label='Observaciones'
          multiline
          rows={3}
          value={observaciones}
          onChange={e => setObservaciones(e.target.value)}
          fullWidth
          margin='dense'
        />

        <TextField
          label='Notas'
          multiline
          rows={3}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          fullWidth
          margin='dense'
        />

        <FormControl fullWidth margin='dense'>
          <InputLabel>Asignar a</InputLabel>
          <Select value={assignedUserId} label='Asignar a' onChange={e => setAssignedUserId(e.target.value as string)}>
            <MenuItem value=''>Sin asignar</MenuItem>
            {users.map(u => (
              <MenuItem key={u.id} value={u.id.toString()}>
                {u.full_name} ({u.email})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {isAdmin && (
          <TextField
            label='Total (admin)'
            type='number'
            value={total}
            onChange={e => setTotal(e.target.value)}
            fullWidth
            margin='dense'
          />
        )}

        {order.photo_url && (
          <Box>
            <Typography variant='caption' color='text.secondary'>
              Foto adjunta:
            </Typography>
            <Box
              component='img'
              src={order.photo_url}
              alt='Foto del pedido'
              sx={{ maxWidth: '100%', maxHeight: 200, mt: 1, borderRadius: 1 }}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button variant='contained' onClick={handleSave} disabled={saving}>
          {saving ? <CircularProgress size={20} /> : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ─────────────────────────── Main Board ─────────────────────────────────────
export default function OrdersPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { fetchApi } = useApi()
  const { showSuccess, showError } = useSnackbar()

  const { stages, loading: stagesLoading, companyId, refetch: refetchStages } = useCompanyStages()
  const { orders, loading: ordersLoading, refetch: refetchOrders } = useOrders()
  const { users } = useCompanyUsers(companyId)

  const [activeOrder, setActiveOrder] = useState<Order | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  // Group orders by stage
  const ordersByStage = useMemo(() => {
    const map: Record<number, Order[]> = {}
    stages.forEach(s => {
      map[s.id] = []
    })
    orders.forEach(o => {
      const stageId = o.current_stage_id
      if (stageId && map[stageId]) {
        map[stageId].push(o)
      } else if (stages.length > 0) {
        // Orders without a valid stage go to the first column
        map[stages[0].id]?.push(o)
      }
    })
    return map
  }, [orders, stages])

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  )

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const orderId = Number(String(event.active.id).replace('order-', ''))
      const order = orders.find(o => o.id === orderId) || null
      setActiveOrder(order)
    },
    [orders]
  )

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveOrder(null)
      const { active, over } = event
      if (!over) return

      const orderId = Number(String(active.id).replace('order-', ''))
      const order = orders.find(o => o.id === orderId)
      if (!order) return

      // Determine target stage
      let targetStageId: number | null = null

      // If dropped over another order card, find that order's stage
      const overIdStr = String(over.id)
      if (overIdStr.startsWith('order-')) {
        const overOrderId = Number(overIdStr.replace('order-', ''))
        const overOrder = orders.find(o => o.id === overOrderId)
        if (overOrder) targetStageId = overOrder.current_stage_id
      } else if (overIdStr.startsWith('stage-')) {
        targetStageId = Number(overIdStr.replace('stage-', ''))
      }

      if (!targetStageId || targetStageId === order.current_stage_id) return

      // Move order to the new stage
      try {
        await fetchApi(`orders/${orderId}/stage`, {
          method: 'PATCH',
          body: { stage_id: targetStageId }
        })
        showSuccess('Pedido movido')
        refetchOrders()
      } catch (err: any) {
        showError(err?.message || 'Error al mover pedido')
      }
    },
    [orders, fetchApi, refetchOrders, showSuccess, showError]
  )

  const handleCardClick = useCallback((order: Order) => {
    setSelectedOrder(order)
    setDetailOpen(true)
  }, [])

  if (stagesLoading || ordersLoading) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' minHeight='300px'>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Cargando tablero de pedidos...</Typography>
      </Box>
    )
  }

  if (stages.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant='h5' sx={{ mb: 2, fontWeight: 600 }}>
          Tablero de Pedidos
        </Typography>
        <Typography variant='body1' color='text.secondary' sx={{ mb: 3 }}>
          No hay etapas configuradas. Configura las etapas de tu flujo de trabajo para comenzar.
        </Typography>
        <Button variant='contained' startIcon={<SettingsIcon />} onClick={() => router.push(ROUTES.ORDERS.STAGES)}>
          Configurar Etapas
        </Button>
      </Box>
    )
  }

  return (
    <Box sx={{ p: { xs: 1, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant='h4' sx={{ fontWeight: 700 }}>
          Tablero de Pedidos
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant='outlined' startIcon={<SettingsIcon />} onClick={() => router.push(ROUTES.ORDERS.STAGES)}>
            Etapas
          </Button>
          <Button variant='contained' startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
            Nuevo Pedido
          </Button>
        </Box>
      </Box>

      {/* Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            overflowX: 'auto',
            pb: 2,
            minHeight: 'calc(100vh - 250px)'
          }}
        >
          {stages.map(stage => (
            <StageColumn
              key={stage.id}
              stage={stage}
              orders={ordersByStage[stage.id] || []}
              onCardClick={handleCardClick}
              users={users}
            />
          ))}
        </Box>

        <DragOverlay>{activeOrder && <OrderCardOverlay order={activeOrder} users={users} />}</DragOverlay>
      </DndContext>

      {/* Create Order Dialog */}
      <CreateOrderDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={refetchOrders}
        stages={stages}
        companyId={companyId}
      />

      {/* Order Detail Modal */}
      <OrderDetailModal
        order={selectedOrder}
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false)
          setSelectedOrder(null)
        }}
        onUpdated={refetchOrders}
        stages={stages}
        users={users}
        companyId={companyId}
        userRole={session?.user?.role}
      />
    </Box>
  )
}
