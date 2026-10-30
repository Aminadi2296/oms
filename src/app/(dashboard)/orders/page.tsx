'use client'

import React, { useState, useCallback, useMemo } from 'react'

import { useRouter } from 'next/navigation'

import { Box, Typography, Button, Paper, CircularProgress, Chip, Avatar, Collapse, Tooltip } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import SettingsIcon from '@mui/icons-material/Settings'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import SubjectIcon from '@mui/icons-material/Subject'

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

import { ROUTES } from '@/constants/routes'
import { useApi } from '@/hooks/useApi'
import { useClientNames } from '@/hooks/useClientNames'
import { useCompanyStages } from '@/hooks/useCompanyStages'
import { useCompanyUsers } from '@/hooks/useCompanyUsers'
import { useOrders } from '@/hooks/useOrders'
import { useSnackbar } from '@/hooks/useSnackbar'
import type { Order, CompanyStage, CompanyUser } from '@/types/order'
import {
  POSITION_STEP,
  completionPatch,
  formatLongDate,
  formatShortDate,
  getInitials,
  getPriorityMeta,
  getUserAvatarUrl,
  isOverdue,
  positionBetween,
  stringToColor
} from '@/utils/orderUi'
import CreateOrderDialog from './components/CreateOrderDialog'
import OrderDetailModal from './components/OrderDetailModal'

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

  const assignedUser = users.find(u => u.id === order.assignedToId)
  const priority = getPriorityMeta(order.priority)
  const overdue = isOverdue(order.deadline, order.completedAt)
  const deadlineLabel = formatShortDate(order.deadline)
  const expanded = hovered && !isDragging

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
        borderLeftColor: priority.color,
        cursor: 'pointer',
        touchAction: 'manipulation',
        transition: 'box-shadow 0.15s ease',
        '&:hover': { boxShadow: '0 6px 16px rgba(0,0,0,0.18)' },
        '&:active': { cursor: 'grabbing' },
        '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 }
      }}
    >
      {/* Order number */}
      <Typography variant='caption' color='text.disabled' sx={{ fontWeight: 600, letterSpacing: 0.3 }}>
        {order.orderNumber}
      </Typography>

      {/* Title + client */}
      <Typography
        variant='body2'
        sx={{
          fontWeight: 600,
          lineHeight: 1.35,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}
      >
        {order.title}
      </Typography>
      <Typography variant='body2' color='text.secondary' noWrap>
        {order.customerName || `Cliente #${order.customerId}`}
      </Typography>

      {/* Details revealed on hover */}
      <Collapse in={expanded} timeout={180} unmountOnExit>
        <Box sx={{ mt: 1, pt: 1, borderTop: '1px dashed', borderColor: 'divider', display: 'grid', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: priority.color, flexShrink: 0 }} />
            <Typography variant='caption' sx={{ fontWeight: 600 }}>
              Prioridad {priority.label.toLowerCase()}
            </Typography>
          </Box>
          {order.description && (
            <Box>
              <Typography variant='caption' color='text.disabled' sx={labelSx}>
                Descripción
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
                {order.description}
              </Typography>
            </Box>
          )}
          <Typography variant='caption' color='text.secondary'>
            Creado el {formatLongDate(order.createdAt) ?? '—'}
          </Typography>
        </Box>
      </Collapse>

      {/* Footer: deadline + indicators (left), assignee (right) */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1.25 }}>
        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 1.25, color: overdue ? 'error.main' : 'text.secondary' }}
        >
          {deadlineLabel && (
            <Tooltip title={overdue ? 'Vencido' : 'Fecha límite'}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <AccessTimeIcon sx={{ fontSize: 14 }} />
                <Typography variant='caption' sx={{ fontWeight: overdue ? 700 : 400 }}>
                  {deadlineLabel}
                </Typography>
              </Box>
            </Tooltip>
          )}
          {order.description && (
            <Tooltip title='Tiene descripción'>
              <SubjectIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
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
  const assignedUser = users.find(u => u.id === order.assignedToId)

  return (
    <Paper
      elevation={0}
      sx={{
        ...cardBaseSx,
        borderLeftColor: getPriorityMeta(order.priority).color,
        width: 280,
        cursor: 'grabbing',
        boxShadow: '0 14px 30px rgba(0,0,0,0.30)',
        transform: 'rotate(2.5deg)'
      }}
    >
      <Typography variant='body2' sx={{ fontWeight: 600 }} noWrap>
        {order.title}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.25 }}>
        <Typography variant='body2' color='text.secondary' noWrap>
          {order.customerName || `Cliente #${order.customerId}`}
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

// ─────────────────────────── Main Board ─────────────────────────────────────
export default function OrdersPage() {
  const router = useRouter()
  const { fetchApi } = useApi()
  const { showError } = useSnackbar()

  const { stages, loading: stagesLoading, companyId } = useCompanyStages()
  const { orders: rawOrders, setOrders, loading: ordersLoading, refetch: refetchOrders } = useOrders()
  const { users } = useCompanyUsers(companyId)
  const { names: clientNames } = useClientNames()

  const [activeOrder, setActiveOrder] = useState<Order | null>(null)
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [createStageId, setCreateStageId] = useState<number | null>(null)

  // The API returns ids only: attach customer / assignee names for display
  const orders = useMemo<Order[]>(
    () =>
      rawOrders.map(o => ({
        ...o,
        customerName: clientNames[o.customerId],
        assignedToName: users.find(u => u.id === o.assignedToId)?.full_name
      })),
    [rawOrders, clientNames, users]
  )

  // Stage an order is displayed in (orders with an unknown stage fall back to the first column)
  const stageIdOf = useCallback(
    (o: Order) => (stages.some(s => s.id === o.stageId) ? o.stageId : (stages[0]?.id ?? o.stageId)),
    [stages]
  )

  // Group + sort orders by stage
  const ordersByStage = useMemo(() => {
    const map: Record<number, Order[]> = {}

    stages.forEach(s => {
      map[s.id] = []
    })
    orders.forEach(o => {
      map[stageIdOf(o)]?.push(o)
    })
    Object.values(map).forEach(list =>
      list.sort(
        (a, b) => a.position - b.position || new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime()
      )
    )

    return map
  }, [orders, stages, stageIdOf])

  const selectedOrder = useMemo(() => orders.find(o => o.id === selectedOrderId) ?? null, [orders, selectedOrderId])

  // New orders go to the bottom of their column
  const getNextPosition = useCallback(
    (stageId: number) => {
      const list = ordersByStage[stageId] ?? []

      return list.length ? Math.max(...list.map(o => o.position)) + POSITION_STEP : POSITION_STEP
    },
    [ordersByStage]
  )

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  )

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const orderId = Number(String(event.active.id).replace('order-', ''))

      setActiveOrder(orders.find(o => o.id === orderId) || null)
    },
    [orders]
  )

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveOrder(null)
      const { active, over } = event

      if (!over) return

      const order = orders.find(o => o.id === Number(String(active.id).replace('order-', '')))

      if (!order) return

      // Where was it dropped?
      const overId = String(over.id)
      let overOrder: Order | undefined
      let targetStageId: number | null = null

      if (overId.startsWith('order-')) {
        overOrder = orders.find(o => o.id === Number(overId.replace('order-', '')))
        targetStageId = overOrder ? stageIdOf(overOrder) : null
      } else if (overId.startsWith('stage-')) {
        targetStageId = Number(overId.replace('stage-', ''))
      }

      if (!targetStageId || overOrder?.id === order.id) return

      const sourceStageId = stageIdOf(order)
      const sourceList = ordersByStage[sourceStageId] ?? []
      const targetList = (ordersByStage[targetStageId] ?? []).filter(o => o.id !== order.id)

      // Index where the card lands inside the target column
      let index = targetList.length

      if (overOrder) {
        const overIdx = targetList.findIndex(o => o.id === overOrder!.id)

        if (overIdx >= 0) {
          const movingDown =
            sourceStageId === targetStageId &&
            sourceList.findIndex(o => o.id === order.id) < sourceList.findIndex(o => o.id === overOrder!.id)

          index = movingDown ? overIdx + 1 : overIdx
        }
      }

      // Dropped exactly where it already was
      if (sourceStageId === targetStageId && sourceList.findIndex(o => o.id === order.id) === index) return

      const targetStage = stages.find(s => s.id === targetStageId)
      const completion = sourceStageId !== targetStageId ? completionPatch(order, !!targetStage?.is_final) : {}

      const updates: { id: number; body: Record<string, unknown> }[] = []
      const pos = positionBetween(targetList[index - 1]?.position, targetList[index]?.position)

      if (pos !== null) {
        updates.push({ id: order.id, body: { stageId: targetStageId, position: pos, ...completion } })
      } else {
        // No room between neighbours: renumber the whole column
        const finalList = [...targetList.slice(0, index), order, ...targetList.slice(index)]

        finalList.forEach((o, i) => {
          const p = (i + 1) * POSITION_STEP

          if (o.id === order.id)
            updates.push({ id: o.id, body: { stageId: targetStageId, position: p, ...completion } })
          else if (o.position !== p) updates.push({ id: o.id, body: { position: p } })
        })
      }

      // Optimistic update: the card moves immediately
      const patches = new Map(updates.map(u => [u.id, u.body]))

      setOrders(prev => prev.map(o => (patches.has(o.id) ? ({ ...o, ...patches.get(o.id) } as Order) : o)))

      try {
        await Promise.all(updates.map(u => fetchApi(`orders/${u.id}`, { method: 'PATCH', body: u.body })))
      } catch (err: any) {
        showError(err?.message || 'Error al mover pedido')
        refetchOrders() // roll back to the server state
      }
    },
    [orders, ordersByStage, stages, stageIdOf, fetchApi, setOrders, refetchOrders, showError]
  )

  const openCreate = (stageId: number | null) => {
    setCreateStageId(stageId)
    setCreateOpen(true)
  }

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
          <Button variant='contained' startIcon={<AddIcon />} onClick={() => openCreate(null)}>
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
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, overflowX: 'auto', pb: 2 }}>
          {stages.map(stage => (
            <StageColumn
              key={stage.id}
              stage={stage}
              orders={ordersByStage[stage.id] || []}
              onCardClick={o => setSelectedOrderId(o.id)}
              onAddOrder={openCreate}
              users={users}
            />
          ))}
        </Box>

        <DragOverlay>{activeOrder && <OrderCardOverlay order={activeOrder} users={users} />}</DragOverlay>
      </DndContext>

      <CreateOrderDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={refetchOrders}
        stages={stages}
        users={users}
        initialStageId={createStageId}
        getNextPosition={getNextPosition}
      />

      <OrderDetailModal
        order={selectedOrder}
        open={selectedOrderId !== null}
        onClose={() => setSelectedOrderId(null)}
        onUpdated={refetchOrders}
        stages={stages}
        users={users}
      />
    </Box>
  )
}
