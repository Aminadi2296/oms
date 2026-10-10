'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Stepper,
  Step,
  StepLabel,
  Divider
} from '@mui/material'
import { ROUTES } from '@/constants/routes'
import { useSnackbar } from '@/hooks/useSnackbar'

const steps = ['Identificación Fiscal', 'Ubicación', 'Contactos', 'Datos Comerciales']

export default function ClientCreatePage() {
  const router = useRouter()
  const { showSuccess, showError } = useSnackbar()
  const [activeStep, setActiveStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    razonSocial: '',
    nombreComercial: '',
    pais: '',
    tipoDocumento: '',
    numeroFiscal: '',
    regimenFiscal: '',
    region: '',
    ciudad: '',
    codigoPostal: '',
    direccionFiscal: '',
    direccionDespacho: '',
    telefonoPrincipal: '',
    correoPrincipal: '',
    sitioWeb: '',
    contactoNombre: '',
    contactoCargo: '',
    contactoTelefono: '',
    contactoCorreo: '',
    condicionPago: '',
    limiteCredito: '',
    moneda: '',
    notas: '',
    estatus: 'Activo'
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name as string]: value }))
  }

  const handleNext = () => setActiveStep(prev => prev + 1)
  const handleBack = () => setActiveStep(prev => prev - 1)

  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      showSuccess('Cliente creado exitosamente!')
      setTimeout(() => {
        router.push(ROUTES.CLIENTS.INDEX)
      }, 1500)
    } catch (error: any) {
      showError('Error al crear el cliente')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant='h6' sx={{ mb: 3, color: 'primary.main' }}>
              1. Identificación y Datos Fiscales
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Razón Social *'
                  name='razonSocial'
                  value={formData.razonSocial}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Nombre Comercial'
                  name='nombreComercial'
                  value={formData.nombreComercial}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label='País' name='pais' value={formData.pais} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label='Tipo Doc. Fiscal (RUT, NIT, RIF)'
                  name='tipoDocumento'
                  value={formData.tipoDocumento}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label='Nro Identificación Fiscal'
                  name='numeroFiscal'
                  value={formData.numeroFiscal}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label='Régimen Fiscal'
                  name='regimenFiscal'
                  value={formData.regimenFiscal}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>
          </Box>
        )
      case 1:
        return (
          <Box>
            <Typography variant='h6' sx={{ mb: 3, color: 'primary.main' }}>
              2. Ubicación
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label='Región / Estado'
                  name='region'
                  value={formData.region}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label='Ciudad / Municipio'
                  name='ciudad'
                  value={formData.ciudad}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label='Código Postal'
                  name='codigoPostal'
                  value={formData.codigoPostal}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label='Dirección Fiscal'
                  name='direccionFiscal'
                  value={formData.direccionFiscal}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label='Dirección de Despacho'
                  name='direccionDespacho'
                  value={formData.direccionDespacho}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>
          </Box>
        )
      case 2:
        return (
          <Box>
            <Typography variant='h6' sx={{ mb: 3, color: 'primary.main' }}>
              3. Contacto Corporativo
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label='Teléfono Principal'
                  name='telefonoPrincipal'
                  value={formData.telefonoPrincipal}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label='Correo Principal'
                  name='correoPrincipal'
                  type='email'
                  value={formData.correoPrincipal}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label='Sitio Web'
                  name='sitioWeb'
                  value={formData.sitioWeb}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 4 }} />

            <Typography variant='h6' sx={{ mb: 3, color: 'primary.main' }}>
              4. Persona de Contacto
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Nombre y Apellido'
                  name='contactoNombre'
                  value={formData.contactoNombre}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Cargo / Área'
                  name='contactoCargo'
                  value={formData.contactoCargo}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Teléfono / Móvil'
                  name='contactoTelefono'
                  value={formData.contactoTelefono}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label='Correo Electrónico'
                  name='contactoCorreo'
                  type='email'
                  value={formData.contactoCorreo}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>
          </Box>
        )
      case 3:
        return (
          <Box>
            <Typography variant='h6' sx={{ mb: 3, color: 'primary.main' }}>
              5. Datos Comerciales
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label='Condición de Pago (ej. 15 días)'
                  name='condicionPago'
                  value={formData.condicionPago}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label='Límite de Crédito'
                  name='limiteCredito'
                  type='number'
                  value={formData.limiteCredito}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label='Moneda Preferida'
                  name='moneda'
                  value={formData.moneda}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 4 }} />

            <Typography variant='h6' sx={{ mb: 3, color: 'primary.main' }}>
              6. Notas y Estatus
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label='Notas y Observaciones'
                  name='notas'
                  value={formData.notas}
                  onChange={handleChange}
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Estatus</InputLabel>
                  <Select name='estatus' value={formData.estatus} label='Estatus' onChange={handleChange as any}>
                    <MenuItem value='Activo'>Activo</MenuItem>
                    <MenuItem value='Inactivo'>Inactivo</MenuItem>
                    <MenuItem value='Bloqueado'>Bloqueado</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        )
      default:
        return 'Unknown step'
    }
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1000, margin: '0 auto' }}>
      <Typography variant='h4' sx={{ mb: 4, fontWeight: 600 }}>
        Crear Nuevo Cliente (B2B)
      </Typography>

      <Paper sx={{ p: 4 }}>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 5 }}>
          {steps.map(label => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ minHeight: 300 }}>{getStepContent(activeStep)}</Box>

        <Box sx={{ mt: 5, display: 'flex', justifyContent: 'space-between', pt: 2, borderTop: '1px solid #eee' }}>
          <Button
            variant='outlined'
            color='secondary'
            onClick={activeStep === 0 ? () => router.back() : handleBack}
            disabled={isSubmitting}
          >
            {activeStep === 0 ? 'Cancelar' : 'Atrás'}
          </Button>

          <Button
            variant='contained'
            color='primary'
            onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext}
            disabled={isSubmitting}
          >
            {activeStep === steps.length - 1 ? (isSubmitting ? 'Guardando...' : 'Guardar Cliente') : 'Siguiente'}
          </Button>
        </Box>
      </Paper>
    </Box>
  )
}
