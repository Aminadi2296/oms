'use client'

import React, { useEffect, useState } from 'react'

import Link from 'next/link'

import {
  Autocomplete,
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
  FormHelperText,
  IconButton,
  MenuItem,
  Select,
  TextField,
  Typography
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'

import { ROUTES } from '@/constants/routes'
import { useApi } from '@/hooks/useApi'
import { useClientOptions } from '@/hooks/useClientOptions'
import { useDebounce } from '@/hooks/useDebounce'
import { useSnackbar } from '@/hooks/useSnackbar'
import type { Client } from '@/types/client'
import type { CompanyStage, CompanyUser, OrderPriority } from '@/types/order'
import {
  dateInputToISO,
  getClientName,
  getClientTaxId,
  getInitials,
  getUserAvatarUrl,
  stringToColor
} from '@/utils/orderUi'
import PriorityPicker from './PriorityPicker'

export interface CreateOrderDialogProps {
  open: boolean
  onClose: () => void
  onCreated: () => void
  stages: CompanyStage[]
  users: CompanyUser[]
  /** Stage preselected when opened from a column's "Agregar pedido" button */
  initialStageId?: number | null
  /** Position that puts a new order at the bottom of a stage */
  getNextPosition: (stageId: number) => number
}

interface FormState {
  title: string
  description: string
  priority: OrderPriority
  deadline: string // YYYY-MM-DD
  stageId: string
  assignedToId: string
}

const emptyForm = (stageId?: number | null): FormState => ({
  title: '',
  description: '',
  priority: 'MEDIUM',
  deadline: '',
  stageId: stageId ? String(stageId) : '',
  assignedToId: ''
})

const sectionLabelSx = {
  display: 'block',
  mb: 1,
  fontWeight: 700,
  letterSpacing: 0.5,
  textTransform: 'uppercase',
  color: 'text.secondary'
} as const

export default function CreateOrderDialog({
  open,
  onClose,
  onCreated,
  stages,
  users,
  initialStageId,
  getNextPosition
}: CreateOrderDialogProps) {
  const { fetchApi } = useApi()
  const { showSuccess, showError } = useSnackbar()

  const [form, setForm] = useState<FormState>(emptyForm(initialStageId ?? stages[0]?.id))
  const [client, setClient] = useState<Client | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [attempted, setAttempted] = useState(false)

  // Client autocomplete (server-side search)
  const [clientQuery, setClientQuery] = useState('')
  const debouncedQuery = useDebounce(clientQuery, 300)
  const { options: clientOptions, loading: clientsLoading } = useClientOptions(debouncedQuery, open)

  // Fresh form every time the dialog opens
  useEffect(() => {
    if (!open) return
    setForm(emptyForm(initialStageId ?? stages[0]?.id))
    setClient(null)
    setClientQuery('')
    setAttempted(false)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialStageId])

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm(f => ({ ...f, [key]: value }))

  const stageId = form.stageId ? Number(form.stageId) : (stages[0]?.id ?? null)
  const titleError = attempted && !form.title.trim()
  const clientError = attempted && !client

  const handleCreate = async () => {
    setAttempted(true)
    if (!form.title.trim() || !client || !stageId) return

    setSubmitting(true)
    try {
      await fetchApi('orders', {
        method: 'POST',
        body: {
          title: form.title.trim(),
          description: form.description.trim() || null,
          customerId: client.id,
          stageId,
          assignedToId: form.assignedToId ? Number(form.assignedToId) : null,
          priority: form.priority,
          deadline: form.deadline ? dateInputToISO(form.deadline) : null,
          position: getNextPosition(stageId)
        }
      })
      showSuccess('Pedido creado exitosamente')
      onCreated()
      onClose()
    } catch (err: any) {
      showError(err?.message || 'Error al crear pedido')
    } finally {
      setSubmitting(false)
    }
  }

  // Keep the selected client in the list so MUI never warns about a value without option
  const options = client && !clientOptions.some(o => o.id === client.id) ? [client, ...clientOptions] : clientOptions

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      fullWidth
      maxWidth='sm'
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', pb: 1 }}>
        <Box>
          <Typography variant='h5' sx={{ fontWeight: 700 }}>
            Nuevo pedido
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Completa los datos para registrarlo en el tablero.
          </Typography>
        </Box>
        <IconButton aria-label='Cerrar' onClick={onClose} disabled={submitting} edge='end' sx={{ mt: -0.5 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 3, py: 3 }}>
        {/* Title */}
        <Box>
          <Typography variant='caption' sx={sectionLabelSx}>
            Título *
          </Typography>
          <TextField
            autoFocus
            fullWidth
            placeholder='Ej: Cotización de póliza colectiva'
            value={form.title}
            onChange={e => setField('title', e.target.value)}
            error={titleError}
            helperText={titleError ? 'El título es obligatorio' : undefined}
            inputProps={{ maxLength: 255 }}
          />
        </Box>

        {/* Client */}
        <Box>
          <Typography variant='caption' sx={sectionLabelSx}>
            Cliente *
          </Typography>
          <Autocomplete
            value={client}
            options={options}
            loading={clientsLoading}
            onChange={(_, v) => setClient(v)}
            onInputChange={(_, v, reason) => {
              if (reason === 'input') setClientQuery(v)
              if (reason === 'clear') setClientQuery('')
            }}
            onClose={() => setClientQuery('')}
            filterOptions={x => x} // filtering is done by the API
            getOptionLabel={o => getClientName(o)}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            noOptionsText={
              clientQuery.trim() ? (
                'No se encontraron clientes'
              ) : (
                <>
                  Aún no hay clientes.{' '}
                  <Link href={ROUTES.CLIENTS.CREATE} style={{ color: 'inherit', fontWeight: 600 }}>
                    Crear uno
                  </Link>
                </>
              )
            }
            loadingText='Buscando clientes...'
            clearText='Quitar cliente'
            openText='Abrir'
            closeText='Cerrar'
            renderOption={(props, o) => {
              const { key, ...rest } = props as any
              const name = getClientName(o)
              const taxId = getClientTaxId(o)

              return (
                <Box component='li' key={key} {...rest} sx={{ gap: 1.5 }}>
                  <Avatar sx={{ width: 32, height: 32, fontSize: 13, fontWeight: 700, bgcolor: stringToColor(name) }}>
                    {getInitials(name)}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant='body2' noWrap sx={{ fontWeight: 600 }}>
                      {name}
                    </Typography>
                    {taxId && (
                      <Typography variant='caption' color='text.secondary' noWrap>
                        {taxId}
                      </Typography>
                    )}
                  </Box>
                </Box>
              )
            }}
            renderInput={params => (
              <TextField
                {...params}
                placeholder='Busca por razón social o número fiscal'
                error={clientError}
                helperText={clientError ? 'Selecciona un cliente' : undefined}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {clientsLoading ? <CircularProgress color='inherit' size={18} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  )
                }}
              />
            )}
          />
        </Box>

        {/* Priority + deadline */}
        <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', sm: '1.4fr 1fr' } }}>
          <Box>
            <Typography variant='caption' sx={sectionLabelSx}>
              Prioridad
            </Typography>
            <PriorityPicker value={form.priority} onChange={v => setField('priority', v)} />
          </Box>
          <Box>
            <Typography variant='caption' sx={sectionLabelSx}>
              Fecha límite
            </Typography>
            <TextField
              type='date'
              fullWidth
              size='small'
              value={form.deadline}
              onChange={e => setField('deadline', e.target.value)}
              helperText='Opcional'
            />
          </Box>
        </Box>

        {/* Stage */}
        <Box>
          <Typography variant='caption' sx={sectionLabelSx}>
            Etapa inicial
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {stages.map(s => {
              const selected = stageId === s.id

              return (
                <Chip
                  key={s.id}
                  label={s.name}
                  clickable
                  color={selected ? 'primary' : 'default'}
                  variant={selected ? 'filled' : 'outlined'}
                  onClick={() => setField('stageId', String(s.id))}
                  sx={{ fontWeight: selected ? 700 : 500 }}
                />
              )
            })}
          </Box>
        </Box>

        {/* Assignee */}
        <Box>
          <Typography variant='caption' sx={sectionLabelSx}>
            Asignado a
          </Typography>
          <FormControl fullWidth>
            <Select
              displayEmpty
              value={form.assignedToId}
              onChange={e => setField('assignedToId', e.target.value as string)}
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
                  <Avatar src={getUserAvatarUrl(u)} alt={u.full_name} sx={{ width: 26, height: 26 }} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant='body2' noWrap sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                      {u.full_name}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {u.email}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
            {users.length <= 1 && (
              <FormHelperText>Cuando se sumen más personas al equipo podrás asignarles pedidos.</FormHelperText>
            )}
          </FormControl>
        </Box>

        {/* Description */}
        <Box>
          <Typography variant='caption' sx={sectionLabelSx}>
            Descripción
          </Typography>
          <TextField
            multiline
            minRows={3}
            maxRows={8}
            fullWidth
            placeholder='Detalles del pedido: qué se solicitó, condiciones, observaciones...'
            value={form.description}
            onChange={e => setField('description', e.target.value)}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={submitting} color='secondary'>
          Cancelar
        </Button>
        <Button
          variant='contained'
          onClick={handleCreate}
          disabled={submitting || stages.length === 0}
          sx={{ minWidth: 140 }}
        >
          {submitting ? <CircularProgress size={20} color='inherit' /> : 'Crear pedido'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
