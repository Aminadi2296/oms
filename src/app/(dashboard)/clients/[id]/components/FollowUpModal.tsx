'use client'

import React, { useState, useEffect } from 'react'

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  IconButton,
  Box
} from '@mui/material'

import { useForm, Controller } from 'react-hook-form'

import RichTextEditorComponent from '@/@core/components/rich-text-editor/RichTextEditor'
import { useApi } from '@/hooks/useApi'
import type { CreateFollowUpPromise } from '@/hooks/useClient'
import { useSnackbar } from '@/hooks/useSnackbar'

interface FollowUpFormData {
  currentDate: string
  nextFollowUpDate: string
  subject: string
  description: string
  assignedBy: string | number
  assignedTo: string | number
  gestion: string | number
}

interface BasicUser {
  id: number
  username: string
  full_name: string
}

interface FollowUpType {
  id: number
  name: string
}

interface FollowUpModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  followUpTypes: FollowUpType[]
  createFollowUp: CreateFollowUpPromise
}

const FollowUpModal = ({ open, onClose, onSuccess, followUpTypes, createFollowUp }: FollowUpModalProps) => {
  const { fetchApi } = useApi()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [users, setUsers] = useState<BasicUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const { showSuccess, showError } = useSnackbar()

  useEffect(() => {
    if (open) {
      const loadUsers = async () => {
        try {
          setLoadingUsers(true)

          const users = await fetchApi<BasicUser[]>('users')

          setUsers(users)
        } catch (err: any) {
          console.error('Error loading users:', err)
          console.error('Error details:', {
            message: err.message,
            stack: err.stack
          })
          setUsers([])
        } finally {
          setLoadingUsers(false)
        }
      }

      loadUsers()
    }
  }, [fetchApi, open])

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<FollowUpFormData>({
    defaultValues: {
      currentDate: new Date().toISOString().split('T')[0],
      nextFollowUpDate: '',
      subject: '',
      description: '',
      assignedBy: '',
      assignedTo: '',
      gestion: ''
    }
  })

  const onSubmit = async (data: FollowUpFormData) => {
    try {
      setIsSubmitting(true)

      const followUpData = {
        subject: data.subject,
        reminder_date: data.nextFollowUpDate,
        description: data.description,
        assigned_to: Number(data.assignedTo),
        assigned_by: Number(data.assignedBy),
        type_id: Number(data.gestion),
        status: true
      }

      await createFollowUp(followUpData)

      showSuccess('Seguimiento creado con éxito')

      reset({
        currentDate: new Date().toISOString().split('T')[0],
        nextFollowUpDate: '',
        subject: '',
        description: '',
        assignedBy: '',
        assignedTo: '',
        gestion: ''
      })

      onSuccess()
      onClose()
    } catch (err: any) {
      showError('Error al crear el seguimiento')
      console.error('Error creating follow-up:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    reset({
      currentDate: new Date().toISOString().split('T')[0],
      nextFollowUpDate: '',
      subject: '',
      description: '',
      assignedBy: '',
      assignedTo: '',
      gestion: ''
    })
    onClose()
  }

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth='md' fullWidth aria-labelledby='follow-up-modal-title'>
        <DialogTitle id='follow-up-modal-title'>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant='h6' component='div'>
              Nuevo Seguimiento
            </Typography>
            <IconButton onClick={handleClose} size='small' aria-label='close'>
              <i className='ri-close-line' />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          <Box component='form' onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Controller
                  name='subject'
                  control={control}
                  rules={{ required: 'El asunto es requerido' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label='Asunto'
                      fullWidth
                      variant='outlined'
                      error={!!errors.subject}
                      helperText={errors.subject?.message}
                      placeholder='Describe el asunto del seguimiento...'
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name='gestion'
                  control={control}
                  rules={{ required: 'El tipo de gestión es requerido' }}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.gestion}>
                      <InputLabel>Tipo de Gestión</InputLabel>
                      <Select {...field} label='Tipo de Gestión' value={field.value ?? ''}>
                        <MenuItem value=''>
                          <em>Seleccionar tipo de gestión</em>
                        </MenuItem>
                        {followUpTypes.map(type => (
                          <MenuItem key={type.id} value={type.id}>
                            {type.name}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.gestion && (
                        <Typography variant='caption' color='error' sx={{ mt: 0.5, ml: 1.75 }}>
                          {errors.gestion.message}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name='nextFollowUpDate'
                  control={control}
                  rules={{ required: 'La fecha de próximo seguimiento es requerida' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label='Próximo Seguimiento'
                      type='date'
                      fullWidth
                      slotProps={{
                        inputLabel: { shrink: true },
                        htmlInput: {
                          min: new Date().toISOString().split('T')[0]
                        }
                      }}
                      error={!!errors.nextFollowUpDate}
                      helperText={errors.nextFollowUpDate?.message}
                      variant='outlined'
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant='subtitle1' sx={{ mb: 1 }}>
                  Descripción
                </Typography>
                <Controller
                  name='description'
                  control={control}
                  render={({ field, fieldState }) => (
                    <>
                      <RichTextEditorComponent name={field.name} control={control} />
                      {fieldState.error && (
                        <Typography color='error' variant='caption' sx={{ mt: 1, display: 'block' }}>
                          {fieldState.error.message}
                        </Typography>
                      )}
                    </>
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name='assignedBy'
                  control={control}
                  rules={{ required: 'El campo "Asignado por" es requerido' }}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.assignedBy}>
                      <InputLabel>Asignado por</InputLabel>
                      <Select {...field} label='Asignado por' value={field.value ?? ''} disabled={loadingUsers}>
                        <MenuItem value=''>
                          <em>Seleccionar usuario</em>
                        </MenuItem>
                        {users.map(user => (
                          <MenuItem key={user.id} value={user.id}>
                            {user.full_name}
                          </MenuItem>
                        ))}
                      </Select>
                      {loadingUsers && (
                        <Typography variant='caption' color='textSecondary'>
                          Cargando agentes...
                        </Typography>
                      )}
                      {errors.assignedBy && (
                        <Typography variant='caption' color='error' sx={{ mt: 0.5, ml: 1.75 }}>
                          {errors.assignedBy.message}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Controller
                  name='assignedTo'
                  control={control}
                  rules={{ required: 'El campo "Asignado a" es requerido' }}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.assignedTo}>
                      <InputLabel>Asignado a</InputLabel>
                      <Select {...field} label='Asignado a' value={field.value ?? ''} disabled={loadingUsers}>
                        <MenuItem value=''>
                          <em>Seleccionar usuario</em>
                        </MenuItem>
                        {users.map(user => (
                          <MenuItem key={user.id} value={user.id}>
                            {user.full_name}
                          </MenuItem>
                        ))}
                      </Select>
                      {loadingUsers && (
                        <Typography variant='caption' color='textSecondary'>
                          Cargando ejecutivos...
                        </Typography>
                      )}
                      {errors.assignedTo && (
                        <Typography variant='caption' color='error' sx={{ mt: 0.5, ml: 1.75 }}>
                          {errors.assignedTo.message}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, mt: 2 }}>
          <Button onClick={handleClose} variant='outlined' disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            variant='contained'
            disabled={isSubmitting}
            startIcon={<i className='ri-save-line' />}
          >
            {isSubmitting ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default FollowUpModal
