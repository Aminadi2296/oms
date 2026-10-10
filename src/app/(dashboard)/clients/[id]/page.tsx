'use client'

import React from 'react'
import { Box, Typography, Button, Paper } from '@mui/material'
import { useRouter } from 'next/navigation'
import { ROUTES } from '@/constants/routes'

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1000, margin: '0 auto' }}>
      <Typography variant='h4' sx={{ mb: 4, fontWeight: 600 }}>
        Detalle del Cliente B2B (ID: {params.id})
      </Typography>

      <Paper sx={{ p: 4 }}>
        <Typography variant='h6' sx={{ color: 'primary.main', mb: 2 }}>
          Información del Cliente
        </Typography>
        <Typography variant='body1' sx={{ mb: 4 }}>
          Aquí se mostrará toda la información detallada del cliente B2B (Datos Fiscales, Ubicación, Contactos
          Corporativos y Datos Comerciales).
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'flex-start', gap: 2 }}>
          <Button variant='outlined' color='primary' onClick={() => router.push(ROUTES.CLIENTS.INDEX)}>
            Volver a la lista
          </Button>
        </Box>
      </Paper>
    </Box>
  )
}
