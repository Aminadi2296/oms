'use client'

import React, { useState } from 'react'

import { useRouter } from 'next/navigation'

import {
  Box,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
  Paper,
  Switch,
  FormControlLabel,
  CircularProgress
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import EditIcon from '@mui/icons-material/Edit'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

import { useCompanyStages } from '@/hooks/useCompanyStages'
import { useApi } from '@/hooks/useApi'
import { useSnackbar } from '@/hooks/useSnackbar'
import { ROUTES } from '@/constants/routes'

const StagesPage = () => {
  const router = useRouter()
  const { fetchApi } = useApi()
  const { showSuccess, showError } = useSnackbar()
  const { stages, loading, companyId, refetch } = useCompanyStages()

  const [newName, setNewName] = useState('')
  const [newIsFinal, setNewIsFinal] = useState(false)
  const [adding, setAdding] = useState(false)

  // Inline edit state
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')

  const handleAdd = async () => {
    if (!newName.trim() || !companyId) return
    setAdding(true)

    try {
      await fetchApi(`companies/${companyId}/stages`, {
        method: 'POST',
        body: { name: newName.trim(), is_final: newIsFinal }
      })
      showSuccess('Etapa creada')
      setNewName('')
      setNewIsFinal(false)
      refetch()
    } catch (e: any) {
      showError(e?.message || 'Error al crear etapa')
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async (stageId: number) => {
    if (!companyId) return
    if (!confirm('¿Estás seguro de borrar esta etapa? Solo se puede borrar si está vacía.')) return

    try {
      await fetchApi(`companies/${companyId}/stages/${stageId}?force=empty`, { method: 'DELETE' })
      showSuccess('Etapa borrada')
      refetch()
    } catch (e: any) {
      showError(e?.message || 'Error al borrar etapa')
    }
  }

  const handleMove = async (stageId: number, direction: 'up' | 'down') => {
    if (!companyId) return
    const index = stages.findIndex(s => s.id === stageId)
    const targetIndex = direction === 'up' ? index - 1 : index + 1

    if (targetIndex < 0 || targetIndex >= stages.length) return
    const targetStage = stages[targetIndex]

    try {
      await Promise.all([
        fetchApi(`companies/${companyId}/stages/${stageId}`, {
          method: 'PUT',
          body: { position: targetStage.position }
        }),
        fetchApi(`companies/${companyId}/stages/${targetStage.id}`, {
          method: 'PUT',
          body: { position: stages[index].position }
        })
      ])
      showSuccess('Orden actualizado')
      refetch()
    } catch (e: any) {
      showError(e?.message || 'Error al reordenar')
    }
  }

  const handleStartEdit = (stageId: number, currentName: string) => {
    setEditingId(stageId)
    setEditingName(currentName)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingName('')
  }

  const handleSaveEdit = async () => {
    if (!companyId || editingId === null || !editingName.trim()) return

    try {
      await fetchApi(`companies/${companyId}/stages/${editingId}`, {
        method: 'PUT',
        body: { name: editingName.trim() }
      })
      showSuccess('Etapa renombrada')
      setEditingId(null)
      setEditingName('')
      refetch()
    } catch (e: any) {
      showError(e?.message || 'Error al renombrar etapa')
    }
  }

  if (loading) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' minHeight='200px'>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Cargando etapas...</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 700, margin: '0 auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => router.push(ROUTES.ORDERS.INDEX)}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant='h4' sx={{ fontWeight: 600 }}>
          Configuración de Etapas
        </Typography>
      </Box>

      <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
        Define las etapas del flujo de trabajo de tus pedidos. Puedes añadir, renombrar, reordenar y eliminar etapas. La
        etapa marcada como &quot;Final&quot; enviará una notificación al cliente cuando un pedido llegue a ella.
      </Typography>

      {/* Add new stage */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant='subtitle1' sx={{ mb: 2, fontWeight: 600 }}>
          Añadir Nueva Etapa
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            label='Nombre de la Etapa'
            value={newName}
            onChange={e => setNewName(e.target.value)}
            sx={{ flex: 1, minWidth: 200 }}
            onKeyDown={e => {
              if (e.key === 'Enter') handleAdd()
            }}
          />
          <FormControlLabel
            control={<Switch checked={newIsFinal} onChange={e => setNewIsFinal(e.target.checked)} />}
            label='Es etapa final'
          />
          <Button variant='contained' color='primary' onClick={handleAdd} disabled={adding || !newName.trim()}>
            {adding ? <CircularProgress size={20} /> : 'Añadir'}
          </Button>
        </Box>
      </Paper>

      {/* Stages list */}
      <Paper sx={{ p: 2 }}>
        {stages.length === 0 ? (
          <Typography color='text.secondary' sx={{ p: 2, textAlign: 'center' }}>
            No hay etapas configuradas aún. Añade tu primera etapa arriba.
          </Typography>
        ) : (
          <List>
            {stages.map((stage, idx) => (
              <React.Fragment key={stage.id}>
                <ListItem
                  secondaryAction={
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {editingId === stage.id ? (
                        <>
                          <IconButton size='small' onClick={handleSaveEdit} color='success'>
                            <CheckIcon />
                          </IconButton>
                          <IconButton size='small' onClick={handleCancelEdit} color='error'>
                            <CloseIcon />
                          </IconButton>
                        </>
                      ) : (
                        <>
                          <IconButton size='small' onClick={() => handleStartEdit(stage.id, stage.name)}>
                            <EditIcon fontSize='small' />
                          </IconButton>
                          <IconButton size='small' onClick={() => handleMove(stage.id, 'up')} disabled={idx === 0}>
                            <ArrowUpwardIcon fontSize='small' />
                          </IconButton>
                          <IconButton
                            size='small'
                            onClick={() => handleMove(stage.id, 'down')}
                            disabled={idx === stages.length - 1}
                          >
                            <ArrowDownwardIcon fontSize='small' />
                          </IconButton>
                          <IconButton size='small' onClick={() => handleDelete(stage.id)} color='error'>
                            <DeleteIcon fontSize='small' />
                          </IconButton>
                        </>
                      )}
                    </Box>
                  }
                >
                  {editingId === stage.id ? (
                    <TextField
                      value={editingName}
                      onChange={e => setEditingName(e.target.value)}
                      size='small'
                      autoFocus
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleSaveEdit()
                        if (e.key === 'Escape') handleCancelEdit()
                      }}
                    />
                  ) : (
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography sx={{ fontWeight: 500 }}>{stage.name}</Typography>
                          {stage.is_final && (
                            <Typography
                              variant='caption'
                              sx={{
                                bgcolor: 'success.light',
                                color: 'success.dark',
                                px: 1,
                                py: 0.25,
                                borderRadius: 1,
                                fontWeight: 600
                              }}
                            >
                              Final
                            </Typography>
                          )}
                        </Box>
                      }
                      secondary={`Posición: ${stage.position}`}
                    />
                  )}
                </ListItem>
                {idx < stages.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  )
}

export default StagesPage
