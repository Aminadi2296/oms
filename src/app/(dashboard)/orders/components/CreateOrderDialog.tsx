'use client'

import React, { useEffect, useState } from 'react'

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
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'

import { useApi } from '@/hooks/useApi'
import { useClientOptions } from '@/hooks/useClientOptions'
import { useDebounce } from '@/hooks/useDebounce'
import { useOrderCategories } from '@/hooks/useOrderCategories'
import { useSnackbar } from '@/hooks/useSnackbar'
import type { Client } from '@/types/client'
import type { CompanyStage, CompanyUser } from '@/types/order'
import {
  getCategoryAccent,
  getClientName,
  getClientTaxId,
  getInitials,
  getUserAvatarUrl,
  stringToColor
} from '@/utils/orderUi'

export interface CreateOrderDialogProps {
  open: boolean
  onClose: () => void
  onCreated: () => void
  stages: CompanyStage[]
  users: CompanyUser[]
  companyId: number | null
  /** Stage preselected when the dialog is opened from a column's "Agregar pedido" button */
  initialStageId?: number | null
}

interface FormState {
  categoria_id: string
  assigned_user_id: string
  current_stage_id: string
  observaciones: string
  notes: string
}

const emptyForm = (stageId?: number | null): FormState => ({
  categoria_id: '',
  assigned_user_id: '',
  current_stage_id: stageId ? String(stageId) : '',
  observaciones: '',
  notes: ''
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
  companyId,
  initialStageId
}: CreateOrderDialogProps) {
  const { fetchApi } = useApi()
  const { showSuccess, showError } = useSnackbar()
  const { categories, loading: categoriesLoading, createCategory } = useOrderCategories(companyId)

  const [form, setForm] = useState<FormState>(emptyForm(initialStageId ?? stages[0]?.id))
  const [client, setClient] = useState<Client | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Client autocomplete (server-side search)
  const [clientQuery, setClientQuery] = useState('')
  const debouncedQuery = useDebounce(clientQuery, 300)
  const { options: clientOptions, loading: clientsLoading } = useClientOptions(debouncedQuery, open)

  // Inline category creation
  const [addingCategory, setAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [savingCategory, setSavingCategory] = useState(false)

  // Fresh form every time the dialog opens
  useEffect(() => {
    if (!open) return
    setForm(emptyForm(initialStageId ?? stages[0]?.id))
    setClient(null)
    setClientQuery('')
    setAddingCategory(false)
    setNewCategoryName('')

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialStageId])

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm(f => ({ ...f, [key]: value }))

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

      if (created) setField('categoria_id', String(created.id))
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
      const body: Record<string, any> = {
        observaciones: form.observaciones.trim() || null,
        notes: form.notes.trim() || null,
        current_stage_id: form.current_stage_id ? Number(form.current_stage_id) : (stages[0]?.id ?? null)
      }

      if (client) body.client_id = client.id
      if (form.categoria_id) body.categoria_id = Number(form.categoria_id)
      if (form.assigned_user_id) body.assigned_user_id = Number(form.assigned_user_id)

      await fetchApi('orders', { method: 'POST', body })
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
      {/* Header */}
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
        {/* Client */}
        <Box>
          <Typography variant='caption' sx={sectionLabelSx}>
            Cliente
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
            // Filtering is done by the API
            filterOptions={x => x}
            getOptionLabel={o => getClientName(o)}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            noOptionsText={clientQuery.trim() ? 'No se encontraron clientes' : 'No hay clientes registrados'}
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
                helperText='Opcional'
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

        {/* Category + assignee */}
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
          <Box>
            <Typography variant='caption' sx={sectionLabelSx}>
              Categoría
            </Typography>
            <FormControl fullWidth disabled={categoriesLoading}>
              <Select
                displayEmpty
                value={form.categoria_id}
                onChange={e => setField('categoria_id', e.target.value as string)}
                renderValue={v => {
                  const cat = categories.find(c => String(c.id) === v)

                  if (!cat) return <Typography color='text.disabled'>Sin categoría</Typography>

                  return (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: getCategoryAccent(cat.name) }} />
                      {cat.name}
                    </Box>
                  )
                }}
              >
                <MenuItem value=''>
                  <Typography color='text.secondary'>Sin categoría</Typography>
                </MenuItem>
                {categories.map(c => (
                  <MenuItem key={c.id} value={String(c.id)} sx={{ gap: 1 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: getCategoryAccent(c.name) }} />
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
              {!categoriesLoading && categories.length === 0 && (
                <FormHelperText>Aún no hay categorías creadas</FormHelperText>
              )}
            </FormControl>

            {addingCategory ? (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 1 }}>
                <TextField
                  autoFocus
                  size='small'
                  placeholder='Nombre de la categoría'
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
                  size='small'
                  onClick={handleAddCategory}
                  disabled={savingCategory || !newCategoryName.trim()}
                  sx={{ minWidth: 80 }}
                >
                  {savingCategory ? <CircularProgress size={18} /> : 'Crear'}
                </Button>
                <IconButton
                  size='small'
                  aria-label='Cancelar'
                  disabled={savingCategory}
                  onClick={() => {
                    setAddingCategory(false)
                    setNewCategoryName('')
                  }}
                >
                  <CloseIcon fontSize='small' />
                </IconButton>
              </Box>
            ) : (
              <Button size='small' startIcon={<AddIcon />} onClick={() => setAddingCategory(true)} sx={{ mt: 0.5 }}>
                Nueva categoría
              </Button>
            )}
          </Box>

          <Box>
            <Typography variant='caption' sx={sectionLabelSx}>
              Asignado a
            </Typography>
            <FormControl fullWidth>
              <Select
                displayEmpty
                value={form.assigned_user_id}
                onChange={e => setField('assigned_user_id', e.target.value as string)}
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
                      {u.role && (
                        <Typography variant='caption' color='text.secondary'>
                          {u.role}
                        </Typography>
                      )}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Initial stage */}
        <Box>
          <Typography variant='caption' sx={sectionLabelSx}>
            Etapa inicial
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {stages.map(s => {
              const selected = (form.current_stage_id || String(stages[0]?.id ?? '')) === String(s.id)

              return (
                <Chip
                  key={s.id}
                  label={s.name}
                  clickable
                  color={selected ? 'primary' : 'default'}
                  variant={selected ? 'filled' : 'outlined'}
                  onClick={() => setField('current_stage_id', String(s.id))}
                  sx={{ fontWeight: selected ? 700 : 500 }}
                />
              )
            })}
          </Box>
        </Box>

        {/* Texts */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box>
            <Typography variant='caption' sx={sectionLabelSx}>
              Observaciones
            </Typography>
            <TextField
              multiline
              minRows={3}
              maxRows={8}
              fullWidth
              placeholder='Detalles del pedido: qué se solicitó, condiciones, fechas...'
              value={form.observaciones}
              onChange={e => setField('observaciones', e.target.value)}
            />
          </Box>
          <Box>
            <Typography variant='caption' sx={sectionLabelSx}>
              Notas internas
            </Typography>
            <TextField
              multiline
              minRows={2}
              maxRows={6}
              fullWidth
              placeholder='Notas para el equipo (opcional)'
              value={form.notes}
              onChange={e => setField('notes', e.target.value)}
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={submitting} color='secondary'>
          Cancelar
        </Button>
        <Button variant='contained' onClick={handleCreate} disabled={submitting || !companyId} sx={{ minWidth: 140 }}>
          {submitting ? <CircularProgress size={20} color='inherit' /> : 'Crear pedido'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
