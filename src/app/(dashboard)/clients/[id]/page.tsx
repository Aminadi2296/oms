'use client'

import React, { useEffect, useState } from 'react'

import { useRouter, useParams } from 'next/navigation'

import { Box, Typography, Paper, Button, CircularProgress } from '@mui/material'

import { ROUTES } from '@/constants/routes'

// Shape of a client returned by the API (extend as needed)
interface Client {
  id: number
  razon_social?: string
  numero_fiscal?: string
  telefono_principal?: string
  correo_principal?: string
  direccion_fiscal?: string

  // other fields can be added later
  [key: string]: any
}

export default function ClientDetailPage() {
  const router = useRouter()
  const { id } = useParams() as { id: string }

  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const res = await fetch(`/api/proxy/clients/${id}`)

        if (!res.ok) {
          throw new Error(`Error ${res.status}`)
        }

        const data = await res.json()

        // API may return { data: client } or the client directly
        const raw = data.data || data

        // Normalize camelCase to snake_case used in UI
        const normalized: Client = {
          ...raw,
          razon_social: (raw as any).razonSocial ?? raw.razon_social,
          numero_fiscal: (raw as any).numeroFiscal ?? raw.numero_fiscal,
          telefono_principal: (raw as any).telefonoPrincipal ?? raw.telefono_principal,
          correo_principal: (raw as any).correoPrincipal ?? raw.correo_principal,
          direccion_fiscal: (raw as any).direccionFiscal ?? raw.direccion_fiscal
        }

        setClient(normalized)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchClient()
  }, [id])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography color='error'>Error al cargar el cliente: {error}</Typography>
        <Button variant='outlined' onClick={() => router.push(ROUTES.CLIENTS.INDEX)}>
          Volver a la lista
        </Button>
      </Box>
    )
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1000, margin: '0 auto' }}>
      <Typography variant='h4' sx={{ mb: 4, fontWeight: 600 }}>
        Detalle del Cliente B2B (ID: {id})
      </Typography>

      <Paper sx={{ p: 4 }}>
        {client ? (
          <>
            <Typography variant='h6' sx={{ color: 'primary.main', mb: 2 }}>
              Información del Cliente
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
              <Typography>
                <strong>Razón Social:</strong> {client.razon_social ?? '-'}
              </Typography>
              <Typography>
                <strong>Número Fiscal:</strong> {client.numero_fiscal ?? '-'}
              </Typography>
              <Typography>
                <strong>Teléfono Principal:</strong> {client.telefono_principal ?? '-'}
              </Typography>
              <Typography>
                <strong>Correo Principal:</strong> {client.correo_principal ?? '-'}
              </Typography>
              <Typography>
                <strong>Dirección Fiscal:</strong> {client.direccion_fiscal ?? '-'}
              </Typography>
            </Box>
          </>
        ) : (
          <Typography>No hay datos del cliente.</Typography>
        )}
        <Box sx={{ display: 'flex', justifyContent: 'flex-start', gap: 2, mt: 3 }}>
          <Button variant='outlined' color='primary' onClick={() => router.push(ROUTES.CLIENTS.INDEX)}>
            Volver a la lista
          </Button>
        </Box>
      </Paper>
    </Box>
  )
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function fetchClient() {
  throw new Error('Function not implemented.')
}
