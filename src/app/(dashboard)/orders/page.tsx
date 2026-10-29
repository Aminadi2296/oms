'use client'

import React, { useState, useCallback, useMemo } from 'react'

import { useRouter } from 'next/navigation'

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
  FormControl
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import SettingsIcon from '@mui/icons-material/Settings'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import SubjectIcon from '@mui/icons-material/Subject'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
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
import { useApi } from '@/hooks/useApi'
import { useSnackbar } from '@/hooks/useSnackbar'
import { ROUTES } from '@/constants/routes'
import type { Order, CompanyStage, CompanyUser } from '@/types/order'
import { getCategoryAccent, getInitials, getUserAvatarUrl, stringToColor } from '@/utils/orderUi'
import CreateOrderDialog from './components/CreateOrderDialog'

// ─────────────────────────── Helpers ────────────────────────────────────────
function formatShortDate(date?: string | null) {
  if (!date) return null
  const d = new Date(date)

  if (isNaN(d.getTime())) return null

  return d.toLocaleDateString('es', { day: 'numeric', month: 'short' })
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
  borderRadius: 1.5,
  bgcolor: 'background.paper',
  border: '1px solid',
  borderColor: 'divider',
  borderLeftWidth: 4,
  boxShadow: '0 1px 2px rgba(0,0,0,0.10)'
} as const

const labelSx = { fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, fontSize: 10.5 } as const

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
  const accent = getCategoryAccent(order.category_name)
  const expanded = hovered && !isDragging
  const hasDetails = !!(order.category_name || order.observaciones || order.notes)

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
        borderLeftColor: accent,
        cursor: 'pointer',
        touchAction: 'manipulation',
        transition: 'box-shadow 0.15s ease',
        '&:hover': { boxShadow: '0 6px 16px rgba(0,0,0,0.18)' },
        '&:active': { cursor: 'grabbing' },
        '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 }
      }}
    >
      {/* Title + client */}
      <Typography variant='body2' sx={{ fontWeight: 600, lineHeight: 1.35 }}>
        {order.numero}
      </Typography>
      <Typography
        variant='body2'
        noWrap
        sx={{
          color: order.client_name ? 'text.secondary' : 'text.disabled',
          fontStyle: order.client_name ? 'normal' : 'italic'
        }}
      >
        {order.client_name || 'Sin cliente'}
      </Typography>

      {/* Details revealed on hover */}
      <Collapse in={expanded && hasDetails} timeout={180} unmountOnExit>
        <Box sx={{ mt: 1, pt: 1, borderTop: '1px dashed', borderColor: 'divider', display: 'grid', gap: 1 }}>
          {order.category_name && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: accent, flexShrink: 0 }} />
              <Typography variant='caption' sx={{ fontWeight: 600 }}>
                {order.category_name}
              </Typography>
            </Box>
          )}
          {order.observaciones && (
            <Box>
              <Typography variant='caption' color='text.disabled' sx={labelSx}>
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
              <Typography variant='caption' color='text.disabled' sx={labelSx}>
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

      {/* Footer: date + indicators (left), assignee (right) */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1.25 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, color: 'text.secondary' }}>
          {dateLabel && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <AccessTimeIcon sx={{ fontSize: 14 }} />
              <Typography variant='caption'>{dateLabel}</Typography>
            </Box>
          )}
          {(order.observaciones || order.notes) && (
            <Tooltip title='Tiene observaciones o notas'>
              <SubjectIcon sx={{ fontSize: 15 }} />
            </Tooltip>
          )}
          {order.photo_url && (
            <Tooltip title='Tiene foto adjunta'>
              <ImageOutlinedIcon sx={{ fontSize: 15 }} />
            </Tooltip>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          {expanded && assignedUser && (
            <Typography variant='caption' color='text.secondary' noWrap sx={{ maxWidth: 110 }}>
              {assignedUser.full_name}
            </Typography>
          )}
          <AssigneeAvatar user={assignedUser} size={26} />
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
        borderLeftColor: getCategoryAccent(order.category_name),
        width: 280,
        cursor: 'grabbing',
        boxShadow: '0 14px 30px rgba(0,0,0,0.30)',
        transform: 'rotate(2.5deg)'
      }}
    >
      <Typography variant='body2' sx={{ fontWeight: 600 }}>
        {order.numero}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.25 }}>
        <Typography variant='body2' color='text.secondary' noWrap>
          {order.client_name || 'Sin cliente'}
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
  onAddOrder: (stageId: number) => void
  users: CompanyUser[]
}

function StageColumn({ stage, orders, onCardClick, onAddOrder, users }: StageColumnProps) {
  const orderIds = useMemo(() => orders.map(o => `order-${o.id}`), [orders])

  // Makes the whole column a valid drop target (needed to drop into empty columns)
  const { setNodeRef, isOver } = useDroppable({ id: `stage-${stage.id}` })

  return (
    <Box
      sx={{
        flex: '0 0 300px',
        width: 300,
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 'calc(100vh - 210px)',
        borderRadius: 2,
        p: 1,
        bgcolor: isOver ? 'action.selected' : 'action.hover',
        outline: '2px solid',
        outlineColor: isOver ? 'primary.main' : 'transparent',
        transition: 'background-color 0.15s ease, outline-color 0.15s ease'
      }}
    >
      {/* Column header pill */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1.5,
          py: 1,
          mb: 1,
          borderRadius: 1.5,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          <Typography variant='subtitle2' noWrap sx={{ fontWeight: 700 }}>
            {stage.name}
          </Typography>
          <Typography variant='caption' color='text.disabled' sx={{ fontWeight: 600 }}>
            {orders.length}
          </Typography>
        </Box>
        {stage.is_final && <Chip label='Final' size='small' color='success' sx={{ height: 20, fontSize: 11 }} />}
      </Box>

      {/* Cards */}
      <Box ref={setNodeRef} sx={{ flex: 1, overflowY: 'auto', minHeight: 60, px: 0.25 }}>
        <SortableContext items={orderIds} strategy={verticalListSortingStrategy}>
          {orders.map(order => (
            <SortableOrderCard key={order.id} order={order} onClick={onCardClick} users={users} />
          ))}
        </SortableContext>
        {orders.length === 0 && (
          <Typography variant='body2' color='text.disabled' sx={{ textAlign: 'center', py: 3, fontStyle: 'italic' }}>
            {isOver ? 'Soltar aquí' : 'Sin pedidos'}
          </Typography>
        )}
      </Box>

      {/* Add card */}
      <Button
        fullWidth
        size='small'
        startIcon={<AddIcon />}
        onClick={() => onAddOrder(stage.id)}
        sx={{ justifyContent: 'flex-start', mt: 0.5, color: 'text.secondary', textTransform: 'none', fontWeight: 500 }}
      >
        Agregar pedido
      </Button>
    </Box>
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

function OrderDetailModal({ order, open, onClose, onUpdated, users, userRole }: OrderDetailModalProps) {
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

  const { stages, loading: stagesLoading, companyId } = useCompanyStages()
  const { orders, loading: ordersLoading, refetch: refetchOrders } = useOrders()
  const { users } = useCompanyUsers(companyId)

  const [activeOrder, setActiveOrder] = useState<Order | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [createStageId, setCreateStageId] = useState<number | null>(null)

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
          <Button
            variant='contained'
            startIcon={<AddIcon />}
            onClick={() => {
              setCreateStageId(null)
              setCreateOpen(true)
            }}
          >
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
            alignItems: 'flex-start',
            gap: 2,
            overflowX: 'auto',
            pb: 2
          }}
        >
          {stages.map(stage => (
            <StageColumn
              key={stage.id}
              stage={stage}
              orders={ordersByStage[stage.id] || []}
              onCardClick={handleCardClick}
              onAddOrder={stageId => {
                setCreateStageId(stageId)
                setCreateOpen(true)
              }}
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
        users={users}
        companyId={companyId}
        initialStageId={createStageId}
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
