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
  IconButton,
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
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import PersonIcon from '@mui/icons-material/Person'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

import {
  DndContext,
  DragOverlay,
  closestCorners,
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

// ─────────────────────────── Order Card ─────────────────────────────────────
interface OrderCardProps {
  order: Order
  onClick: (order: Order) => void
  users: CompanyUser[]
}

function SortableOrderCard({ order, onClick, users }: OrderCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `order-${order.id}`
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1
  }

  const assignedUser = users.find(u => u.id === order.assigned_user_id)

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      sx={{
        p: 2,
        mb: 1.5,
        cursor: 'pointer',
        border: '1px solid',
        borderColor: 'divider',
        '&:hover': { boxShadow: 3, borderColor: 'primary.main' },
        transition: 'all 0.2s ease'
      }}
      onClick={() => onClick(order)}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <IconButton size='small' {...attributes} {...listeners} sx={{ cursor: 'grab', p: 0.5 }}>
          <DragIndicatorIcon fontSize='small' />
        </IconButton>
        <Typography variant='subtitle2' sx={{ fontWeight: 700, color: 'primary.main' }}>
          {order.numero}
        </Typography>
      </Box>

      {order.client_name && (
        <Typography variant='body2' color='text.secondary' sx={{ mb: 0.5 }}>
          {order.client_name}
        </Typography>
      )}

      {order.observaciones && (
        <Typography
          variant='caption'
          color='text.secondary'
          sx={{ display: 'block', mb: 1, lineClamp: 2, overflow: 'hidden' }}
        >
          {order.observaciones}
        </Typography>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {order.category_name && <Chip label={order.category_name} size='small' variant='outlined' />}
        {assignedUser && (
          <Tooltip title={assignedUser.full_name}>
            <Avatar sx={{ width: 24, height: 24, fontSize: 12, bgcolor: 'primary.main' }}>
              {assignedUser.full_name?.charAt(0)?.toUpperCase() || <PersonIcon fontSize='small' />}
            </Avatar>
          </Tooltip>
        )}
      </Box>
    </Paper>
  )
}

// Simple card for drag overlay (no sortable hooks)
function OrderCardOverlay({ order }: { order: Order }) {
  return (
    <Paper sx={{ p: 2, border: '2px solid', borderColor: 'primary.main', boxShadow: 6, width: 260 }}>
      <Typography variant='subtitle2' sx={{ fontWeight: 700, color: 'primary.main' }}>
        {order.numero}
      </Typography>
      {order.client_name && (
        <Typography variant='body2' color='text.secondary'>
          {order.client_name}
        </Typography>
      )}
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

  return (
    <Box
      sx={{
        minWidth: 280,
        maxWidth: 320,
        flex: '0 0 280px',
        bgcolor: 'grey.50',
        borderRadius: 2,
        p: 1.5,
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 'calc(100vh - 200px)',
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, px: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant='subtitle1' sx={{ fontWeight: 700 }}>
            {stage.name}
          </Typography>
          <Chip label={orders.length} size='small' color='primary' variant='outlined' />
        </Box>
        {stage.is_final && <Chip label='Final' size='small' color='success' />}
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 100, px: 0.5 }}>
        <SortableContext items={orderIds} strategy={verticalListSortingStrategy}>
          {orders.map(order => (
            <SortableOrderCard key={order.id} order={order} onClick={onCardClick} users={users} />
          ))}
        </SortableContext>
        {orders.length === 0 && (
          <Typography variant='body2' color='text.disabled' sx={{ textAlign: 'center', mt: 4, fontStyle: 'italic' }}>
            Sin pedidos
          </Typography>
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
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    client_id: '',
    observaciones: '',
    notes: '',
    current_stage_id: ''
  })

  const handleCreate = async () => {
    if (!companyId) return
    setSubmitting(true)
    try {
      const body: any = {
        observaciones: form.observaciones || null,
        notes: form.notes || null
      }

      if (form.client_id) body.client_id = Number(form.client_id)
      if (form.current_stage_id) {
        body.current_stage_id = Number(form.current_stage_id)
      } else if (stages.length > 0) {
        body.current_stage_id = stages[0].id
      }

      await fetchApi('orders', { method: 'POST', body })
      showSuccess('Pedido creado exitosamente')
      setForm({ client_id: '', observaciones: '', notes: '', current_stage_id: '' })
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

        <DragOverlay>{activeOrder && <OrderCardOverlay order={activeOrder} />}</DragOverlay>
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
