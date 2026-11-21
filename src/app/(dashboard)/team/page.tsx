'use client'

import React, { useEffect, useMemo, useState } from 'react'

import { useSession } from 'next-auth/react'

import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import SearchIcon from '@mui/icons-material/Search'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined'
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined'
import PendingActionsOutlinedIcon from '@mui/icons-material/PendingActionsOutlined'

import { useApi } from '@/hooks/useApi'
import { useCompanyUsers } from '@/hooks/useCompanyUsers'
import { useSnackbar } from '@/hooks/useSnackbar'
import type { CompanyUser } from '@/types/order'
import { getInitials, getUserAvatarUrl, stringToColor } from '@/utils/orderUi'

const SUGGESTED_JOB_TITLES = [
  'Ventas',
  'Cotización',
  'Diseño',
  'Producción',
  'Control de Calidad',
  'Logística',
  'Instalación',
  'Administración'
]

const ROLE_LABELS: Record<string, { label: string; color: 'primary' | 'default' | 'secondary' }> = {
  SUPERADMIN: { label: 'Super Admin', color: 'secondary' },
  COMPANY_ADMIN: { label: 'Administrador', color: 'primary' },
  EMPLOYEE: { label: 'Miembro', color: 'default' }
}

interface MemberFormState {
  full_name: string
  email: string
  password: string
  role: 'COMPANY_ADMIN' | 'EMPLOYEE'
  job_title: string
  phone: string
  avatar_url: string
  is_active: boolean
}

const emptyForm: MemberFormState = {
  full_name: '',
  email: '',
  password: '',
  role: 'EMPLOYEE',
  job_title: '',
  phone: '',
  avatar_url: '',
  is_active: true
}

export default function TeamPage() {
  const { data: session } = useSession()
  const { fetchApi } = useApi()
  const { showSuccess, showError } = useSnackbar()

  const [companyId, setCompanyId] = useState<number | null>(null)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const [currentUserRole, setCurrentUserRole] = useState<string>('COMPANY_ADMIN')

  useEffect(() => {
    if (session?.user?.companyId) {
      setCompanyId(Number(session.user.companyId))
    }

    if (session?.user?.id) {
      setCurrentUserId(Number(session.user.id))
    }

    if (session?.user?.role) {
      setCurrentUserRole(session.user.role)
    }

    if (session?.accessToken && (!session?.user?.companyId || !session?.user?.role)) {
      fetchApi<any>('auth/me')
        .then(me => {
          const cid = me?.company_id ?? me?.companyId

          if (cid) setCompanyId(Number(cid))
          if (me?.id) setCurrentUserId(Number(me.id))
          if (me?.role) setCurrentUserRole(me.role)
        })
        .catch(() => {})
    }
  }, [session, fetchApi])

  const { users, loading, refetch } = useCompanyUsers(companyId)

  const [search, setSearch] = useState('')
  const [selectedTag, setSelectedTag] = useState<string>('ALL')

  // Create / Edit modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<CompanyUser | null>(null)
  const [form, setForm] = useState<MemberFormState>(emptyForm)
  const [saving, setSaving] = useState(false)

  // Delete confirmation state
  const [memberToDelete, setMemberToDelete] = useState<CompanyUser | null>(null)
  const [deleting, setDeleting] = useState(false)

  const isAdmin = currentUserRole === 'COMPANY_ADMIN' || currentUserRole === 'SUPERADMIN'

  // Collect all distinct job_title tags defined in the company
  const companyTags = useMemo(() => {
    const set = new Set<string>()

    users.forEach(u => {
      if (u.job_title?.trim()) set.add(u.job_title.trim())
    })

    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'))
  }, [users])

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase()

    return users.filter(u => {
      if (selectedTag !== 'ALL') {
        if ((u.job_title?.trim() || '') !== selectedTag) return false
      }

      if (!q) return true

      return (
        u.full_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        (u.job_title && u.job_title.toLowerCase().includes(q))
      )
    })
  }, [users, search, selectedTag])

  const openCreateModal = () => {
    setEditingMember(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEditModal = (member: CompanyUser) => {
    setEditingMember(member)
    setForm({
      full_name: member.full_name || '',
      email: member.email || '',
      password: '',
      role: member.role === 'COMPANY_ADMIN' ? 'COMPANY_ADMIN' : 'EMPLOYEE',
      job_title: member.job_title || '',
      phone: member.phone || '',
      avatar_url: member.avatar_url || '',
      is_active: member.is_active ?? true
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    if (saving) return
    setModalOpen(false)
    setEditingMember(null)
  }

  const handleSave = async () => {
    if (!companyId) return

    if (!form.full_name.trim() || !form.email.trim()) {
      showError('El nombre y el correo electrónico son obligatorios')

      return
    }

    if (!editingMember && form.password.trim().length < 6) {
      showError('La contraseña debe tener al menos 6 caracteres')

      return
    }

    if (editingMember && form.password.trim() && form.password.trim().length < 6) {
      showError('La nueva contraseña debe tener al menos 6 caracteres')

      return
    }

    setSaving(true)

    try {
      if (editingMember) {
        const body: Record<string, unknown> = {
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          role: form.role,
          job_title: form.job_title.trim() || null,
          phone: form.phone.trim() || null,
          avatar_url: form.avatar_url.trim() || null,
          is_active: form.is_active
        }

        if (form.password.trim()) {
          body.password = form.password.trim()
        }

        await fetchApi(`companies/${companyId}/users/${editingMember.id}`, {
          method: 'PATCH',
          body
        })
        showSuccess('Miembro actualizado')
      } else {
        await fetchApi(`companies/${companyId}/users`, {
          method: 'POST',
          body: {
            full_name: form.full_name.trim(),
            email: form.email.trim(),
            password: form.password.trim(),
            role: form.role,
            job_title: form.job_title.trim() || null,
            phone: form.phone.trim() || null,
            avatar_url: form.avatar_url.trim() || null,
            is_active: form.is_active
          }
        })
        showSuccess('Miembro añadido al equipo')
      }

      setModalOpen(false)
      setEditingMember(null)
      refetch()
    } catch (err: any) {
      showError(err?.message || 'Error al guardar miembro del equipo')
    } finally {
      setSaving(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!companyId || !memberToDelete) return
    setDeleting(true)

    try {
      await fetchApi(`companies/${companyId}/users/${memberToDelete.id}`, {
        method: 'DELETE'
      })
      showSuccess('Miembro eliminado del equipo')
      setMemberToDelete(null)
      refetch()
    } catch (err: any) {
      showError(err?.message || 'Error al eliminar miembro')
    } finally {
      setDeleting(false)
    }
  }

  if (loading && users.length === 0) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' minHeight='300px'>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Cargando equipo...</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
          mb: 3
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant='h4' sx={{ fontWeight: 700 }}>
              Equipo
            </Typography>
            <Chip label={`${users.length} miembro${users.length === 1 ? '' : 's'}`} size='small' color='primary' />
          </Box>
          <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
            Gestiona los miembros de tu empresa, asigna etiquetas según su área o cargo y consulta sus pedidos.
          </Typography>
        </Box>

        {isAdmin && (
          <Button variant='contained' startIcon={<AddIcon />} onClick={openCreateModal}>
            Nuevo Miembro
          </Button>
        )}
      </Box>

      {/* Search & Tag Filters */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          size='small'
          fullWidth
          placeholder='Buscar por nombre, correo o etiqueta de cargo...'
          value={search}
          onChange={e => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <SearchIcon fontSize='small' color='action' />
              </InputAdornment>
            )
          }}
        />

        {companyTags.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 600, mr: 0.5 }}>
              Filtrar por cargo:
            </Typography>
            <Chip
              label='Todos'
              size='small'
              color={selectedTag === 'ALL' ? 'primary' : 'default'}
              variant={selectedTag === 'ALL' ? 'filled' : 'outlined'}
              onClick={() => setSelectedTag('ALL')}
            />
            {companyTags.map(tag => (
              <Chip
                key={tag}
                label={tag}
                size='small'
                color={selectedTag === tag ? 'primary' : 'default'}
                variant={selectedTag === tag ? 'filled' : 'outlined'}
                onClick={() => setSelectedTag(tag)}
              />
            ))}
          </Box>
        )}
      </Paper>

      {/* Team Cards Grid */}
      {filteredUsers.length === 0 ? (
        <Paper sx={{ p: 5, textAlign: 'center' }}>
          <Typography variant='h6' sx={{ mb: 1 }}>
            No se encontraron miembros
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            {search || selectedTag !== 'ALL'
              ? 'Prueba ajustando los filtros de búsqueda.'
              : 'Añade el primer miembro de tu equipo para poder asignarle pedidos.'}
          </Typography>
        </Paper>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 2.5
          }}
        >
          {filteredUsers.map(member => {
            const roleInfo = ROLE_LABELS[member.role] ?? { label: member.role, color: 'default' as const }
            const isActive = member.is_active !== false
            const isSelf = member.id === currentUserId
            const tagColor = member.job_title ? stringToColor(member.job_title) : undefined

            return (
              <Paper
                key={member.id}
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  position: 'relative',
                  opacity: isActive ? 1 : 0.65,
                  transition: 'box-shadow 0.2s ease, transform 0.15s ease',
                  '&:hover': {
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                {/* Top-right admin actions */}
                {isAdmin && (
                  <Box sx={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 0.25 }}>
                    <Tooltip title='Editar miembro'>
                      <IconButton size='small' onClick={() => openEditModal(member)}>
                        <EditOutlinedIcon fontSize='small' />
                      </IconButton>
                    </Tooltip>
                    {!isSelf && (
                      <Tooltip title='Eliminar miembro'>
                        <IconButton size='small' color='error' onClick={() => setMemberToDelete(member)}>
                          <DeleteOutlineIcon fontSize='small' />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                )}

                {/* Status pill top-left */}
                <Box sx={{ position: 'absolute', top: 12, left: 12 }}>
                  <Tooltip title={isActive ? 'Usuario activo' : 'Usuario inactivo'}>
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        bgcolor: isActive ? 'success.main' : 'text.disabled'
                      }}
                    />
                  </Tooltip>
                </Box>

                {/* Avatar at top */}
                <Avatar
                  src={getUserAvatarUrl(member)}
                  alt={member.full_name}
                  sx={{
                    width: 72,
                    height: 72,
                    mt: 1,
                    mb: 1.5,
                    fontSize: 26,
                    fontWeight: 700,
                    bgcolor: stringToColor(member.full_name || String(member.id)),
                    boxShadow: '0 4px 12px rgba(0,0,0,0.12)'
                  }}
                >
                  {getInitials(member.full_name)}
                </Avatar>

                {/* Full name */}
                <Typography variant='subtitle1' sx={{ fontWeight: 700, lineHeight: 1.3 }} noWrap>
                  {member.full_name}
                  {isSelf ? ' (Tú)' : ''}
                </Typography>

                {/* Business Role / Custom Tag + System Permission Chip */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 0.75,
                    mt: 1,
                    mb: 1.5,
                    flexWrap: 'wrap'
                  }}
                >
                  {member.job_title ? (
                    <Chip
                      size='small'
                      label={member.job_title}
                      sx={{
                        fontWeight: 600,
                        bgcolor: tagColor,
                        color: '#fff',
                        height: 22,
                        fontSize: 11.5
                      }}
                    />
                  ) : (
                    <Chip
                      size='small'
                      label='Sin etiqueta'
                      variant='outlined'
                      sx={{ height: 22, fontSize: 11, color: 'text.disabled' }}
                    />
                  )}

                  <Chip
                    size='small'
                    variant='outlined'
                    color={roleInfo.color}
                    icon={
                      member.role === 'COMPANY_ADMIN' || member.role === 'SUPERADMIN' ? (
                        <AdminPanelSettingsOutlinedIcon sx={{ fontSize: '14px !important' }} />
                      ) : (
                        <PersonOutlineIcon sx={{ fontSize: '14px !important' }} />
                      )
                    }
                    label={roleInfo.label}
                    sx={{ height: 22, fontSize: 11 }}
                  />
                </Box>

                {/* Contact details */}
                <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 0.5, mb: 2 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 0.75,
                      color: 'text.secondary'
                    }}
                  >
                    <EmailOutlinedIcon sx={{ fontSize: 15 }} />
                    <Typography variant='caption' noWrap sx={{ maxWidth: 200 }}>
                      {member.email}
                    </Typography>
                  </Box>
                  {member.phone && (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 0.75,
                        color: 'text.secondary'
                      }}
                    >
                      <PhoneOutlinedIcon sx={{ fontSize: 15 }} />
                      <Typography variant='caption' noWrap>
                        {member.phone}
                      </Typography>
                    </Box>
                  )}
                </Box>

                <Divider sx={{ width: '100%', mt: 'auto', mb: 1.5 }} />

                {/* Orders workload & completed stats */}
                <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-around' }}>
                  <Tooltip title='Pedidos asignados actualmente en proceso'>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'warning.main' }}>
                        <PendingActionsOutlinedIcon sx={{ fontSize: 16 }} />
                        <Typography variant='subtitle2' sx={{ fontWeight: 700 }}>
                          {member.active_orders_count ?? 0}
                        </Typography>
                      </Box>
                      <Typography variant='caption' color='text.secondary'>
                        En proceso
                      </Typography>
                    </Box>
                  </Tooltip>

                  <Divider orientation='vertical' flexItem />

                  <Tooltip title='Pedidos finalizados asignados a este miembro'>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'success.main' }}>
                        <AssignmentTurnedInOutlinedIcon sx={{ fontSize: 16 }} />
                        <Typography variant='subtitle2' sx={{ fontWeight: 700 }}>
                          {member.completed_orders_count ?? 0}
                        </Typography>
                      </Box>
                      <Typography variant='caption' color='text.secondary'>
                        Completados
                      </Typography>
                    </Box>
                  </Tooltip>
                </Box>
              </Paper>
            )
          })}
        </Box>
      )}

      {/* Create / Edit Member Dialog */}
      <Dialog open={modalOpen} onClose={closeModal} fullWidth maxWidth='sm' PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingMember ? 'Editar Miembro del Equipo' : 'Nuevo Miembro del Equipo'}
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, py: 2.5 }}>
          <TextField
            label='Nombre completo'
            required
            fullWidth
            value={form.full_name}
            onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
          />

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
            <TextField
              label='Correo electrónico'
              type='email'
              required
              fullWidth
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            />
            <TextField
              label='Teléfono (opcional)'
              fullWidth
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            />
          </Box>

          <Box>
            <TextField
              label='Etiqueta / Cargo en el negocio'
              placeholder='Ej: Diseño, Producción, Ventas, Instalador...'
              fullWidth
              value={form.job_title}
              onChange={e => setForm(f => ({ ...f, job_title: e.target.value }))}
              helperText='Personaliza el área o cargo según la estructura de tu empresa. También puedes elegir una sugerencia:'
            />
            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 1 }}>
              {Array.from(new Set([...companyTags, ...SUGGESTED_JOB_TITLES])).map(tag => (
                <Chip
                  key={tag}
                  label={tag}
                  size='small'
                  color={form.job_title === tag ? 'primary' : 'default'}
                  variant={form.job_title === tag ? 'filled' : 'outlined'}
                  onClick={() => setForm(f => ({ ...f, job_title: tag }))}
                />
              ))}
            </Box>
          </Box>

          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
            <FormControl fullWidth>
              <InputLabel>Permiso en el sistema</InputLabel>
              <Select
                label='Permiso en el sistema'
                value={form.role}
                disabled={editingMember?.id === currentUserId}
                onChange={e => setForm(f => ({ ...f, role: e.target.value as 'COMPANY_ADMIN' | 'EMPLOYEE' }))}
              >
                <MenuItem value='EMPLOYEE'>Miembro / Empleado</MenuItem>
                <MenuItem value='COMPANY_ADMIN'>Administrador</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label={editingMember ? 'Nueva contraseña (opcional)' : 'Contraseña de acceso'}
              type='password'
              required={!editingMember}
              fullWidth
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              helperText={editingMember ? 'Déjalo vacío para mantener la actual' : 'Mínimo 6 caracteres'}
            />
          </Box>

          <TextField
            label='URL de foto / avatar (opcional)'
            placeholder='https://...'
            fullWidth
            value={form.avatar_url}
            onChange={e => setForm(f => ({ ...f, avatar_url: e.target.value }))}
            helperText='Si se deja vacío, se mostrará un avatar con sus iniciales.'
          />

          <FormControlLabel
            control={
              <Switch
                checked={form.is_active}
                disabled={editingMember?.id === currentUserId}
                onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
              />
            }
            label='Cuenta activa (puede iniciar sesión y recibir pedidos)'
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={closeModal} disabled={saving} color='secondary'>
            Cancelar
          </Button>
          <Button variant='contained' onClick={handleSave} disabled={saving} sx={{ minWidth: 130 }}>
            {saving ? (
              <CircularProgress size={20} color='inherit' />
            ) : editingMember ? (
              'Guardar Cambios'
            ) : (
              'Crear Miembro'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(memberToDelete)}
        onClose={deleting ? undefined : () => setMemberToDelete(null)}
        maxWidth='xs'
        fullWidth
      >
        <DialogTitle>Eliminar miembro del equipo</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseas eliminar a <strong>{memberToDelete?.full_name}</strong> del equipo? Los pedidos
            que tenga asignados quedarán sin asignar.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMemberToDelete(null)} disabled={deleting} color='secondary'>
            Cancelar
          </Button>
          <Button onClick={handleConfirmDelete} disabled={deleting} color='error' variant='contained'>
            {deleting ? <CircularProgress size={20} color='inherit' /> : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
