'use client'

import React, { useEffect, useState } from 'react'

import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  MenuItem,
  Select,
  TextField,
  Typography
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'

import { useApi } from '@/hooks/useApi'
import { useSnackbar } from '@/hooks/useSnackbar'
import type { CompanyStage, CompanyUser, Order, OrderPriority } from '@/types/order'
import { completionPatch, dateInputToISO, formatLongDate, getUserAvatarUrl, isoToDateInput } from '@/utils/orderUi'
import PriorityPicker from './PriorityPicker'

interface OrderDetailModalProps {
  order: Order | null
  open: boolean
  onClose: () => void
  onUpdated: () => void
  stages: CompanyStage[]
  users: CompanyUser[]
}

const sectionLabelSx = {
  display: 'block',
  mb: 1,
  fontWeight: 700,
  letterSpacing: 0.5,
  textTransform: 'uppercase',
  color: 'text.secondary'
} as const

export default function OrderDetailModal({ order, open, onClose, onUpdated, stages, users }: OrderDetailModalProps) {
  const { fetchApi } = useApi()
  const { showSuccess, showError } = useSnackbar()
  const [saving, setSaving] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<OrderPriority>('MEDIUM')
  const [deadline, setDeadline] = useState('')
  const [stageId, setStageId] = useState('')
  const [assignedToId, setAssignedToId] = useState('')

  // Sync local state when the order changes
  useEffect(() => {
    if (!order) return
    setTitle(order.title)
    setDescription(order.description || '')
    setPriority(order.priority)
    setDeadline(isoToDateInput(order.deadline))
    setStageId(String(order.stageId))
    setAssignedToId(order.assignedToId ? String(order.assignedToId) : '')
  }, [order])

  if (!order) return null

  const handleSave = async () => {
    if (!title.trim()) {
      showError('El título es obligatorio')

      return
    }

    // Send only what changed
    const body: Record<string, unknown> = {}

    if (title.trim() !== order.title) body.title = title.trim()
    if ((description.trim() || null) !== (order.description || null)) body.description = description.trim() || null
    if (priority !== order.priority) body.priority = priority

    if (deadline !== isoToDateInput(order.deadline)) body.deadline = deadline ? dateInputToISO(deadline) : null

    if (Number(stageId) !== order.stageId) {
      const target = stages.find(s => s.id === Number(stageId))

      body.stageId = Number(stageId)
      Object.assign(body, completionPatch(order, !!target?.is_final))
    }

    const newAssignee = assignedToId ? Number(assignedToId) : null

    if (newAssignee !== order.assignedToId) body.assignedToId = newAssignee

    if (Object.keys(body).length === 0) {
      onClose()

      return
    }

    setSaving(true)
    try {
      await fetchApi(`orders/${order.id}`, { method: 'PATCH', body })
      showSuccess('Pedido actualizado')
      onUpdated()
      onClose()
    } catch (err: any) {
      showError(err?.message || 'Error al actualizar pedido')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth='sm'
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', pb: 1 }}>
        <Box sx={{ minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Chip size='small' label={order.orderNumber} sx={{ fontWeight: 700 }} />
            {order.completedAt && <Chip size='small' color='success' label='Completado' />}
          </Box>
          <Typography variant='body2' color='text.secondary'>
            {order.customerName ? `${order.customerName} · ` : ''}
            Creado el {formatLongDate(order.createdAt) ?? '—'}
          </Typography>
        </Box>
        <IconButton aria-label='Cerrar' onClick={onClose} disabled={saving} edge='end' sx={{ mt: -0.5 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 3, py: 3 }}>
        <Box>
          <Typography variant='caption' sx={sectionLabelSx}>
            Título
          </Typography>
          <TextField
            fullWidth
            value={title}
            onChange={e => setTitle(e.target.value)}
            error={!title.trim()}
            inputProps={{ maxLength: 255 }}
          />
        </Box>

        <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', sm: '1.4fr 1fr' } }}>
          <Box>
            <Typography variant='caption' sx={sectionLabelSx}>
              Prioridad
            </Typography>
            <PriorityPicker value={priority} onChange={setPriority} />
          </Box>
          <Box>
            <Typography variant='caption' sx={sectionLabelSx}>
              Fecha límite
            </Typography>
            <TextField
              type='date'
              fullWidth
              size='small'
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
            />
          </Box>
        </Box>

        <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
          <Box>
            <Typography variant='caption' sx={sectionLabelSx}>
              Etapa
            </Typography>
            <FormControl fullWidth size='small'>
              <Select value={stageId} onChange={e => setStageId(e.target.value as string)}>
                {stages.map(s => (
                  <MenuItem key={s.id} value={String(s.id)}>
                    {s.name}
                    {s.is_final ? ' (final)' : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box>
            <Typography variant='caption' sx={sectionLabelSx}>
              Asignado a
            </Typography>
            <FormControl fullWidth size='small'>
              <Select
                displayEmpty
                value={assignedToId}
                onChange={e => setAssignedToId(e.target.value as string)}
                renderValue={v => {
                  const u = users.find(x => String(x.id) === v)

                  if (!u) return <Typography color='text.disabled'>Sin asignar</Typography>

                  return (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar src={getUserAvatarUrl(u)} alt={u.full_name} sx={{ width: 22, height: 22 }} />
                      {u.full_name}
                    </Box>
                  )
                }}
              >
                <MenuItem value=''>
                  <Typography color='text.secondary'>Sin asignar</Typography>
                </MenuItem>
                {users.map(u => (
                  <MenuItem key={u.id} value={String(u.id)} sx={{ gap: 1.25 }}>
                    <Avatar src={getUserAvatarUrl(u)} alt={u.full_name} sx={{ width: 24, height: 24 }} />
                    {u.full_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        <Box>
          <Typography variant='caption' sx={sectionLabelSx}>
            Descripción
          </Typography>
          <TextField
            multiline
            minRows={3}
            maxRows={10}
            fullWidth
            placeholder='Sin descripción'
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={saving} color='secondary'>
          Cancelar
        </Button>
        <Button variant='contained' onClick={handleSave} disabled={saving} sx={{ minWidth: 120 }}>
          {saving ? <CircularProgress size={20} color='inherit' /> : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
