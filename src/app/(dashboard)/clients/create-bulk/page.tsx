'use client'

import { useState, useCallback, useRef } from 'react'

import { Box, Typography, Paper, Button, Stack, Alert, CircularProgress } from '@mui/material'

import { CloudUpload as CloudUploadIcon, CloudDownload as CloudDownloadIcon } from '@mui/icons-material'

import { API_ROUTES } from '@/constants/routes'
import { useApi } from '@/hooks/useApi'

export default function BulkClientCreatePage() {
  const { uploadFile } = useApi()
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const performUpload = useCallback(
    async (file: File) => {
      setError(null)
      setSuccess(null)
      setUploading(true)

      try {
        const response = await uploadFile<any>(API_ROUTES.CLIENTS.CREATE_BULK, file, {})

        if (response?.success === false) {
          setError('Uno de tus clientes ya está registrado.')
        } else if (response?.errors?.length) {
          setError(`No se pudo subir el archivo. Errores: ${response.errors.join(', ')}`)
        } else {
          setSuccess('Los clientes han sido añadidos con éxito.')
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido al subir el archivo.'

        setError(message)
      }
    },
    [uploadFile]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragging(false)

      const file = e.dataTransfer.files?.[0]

      if (!file) return

      void performUpload(file)
    },
    [performUpload]
  )

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]

      if (!file) return
      void performUpload(file)
      e.currentTarget.value = ''
    },
    [performUpload]
  )

  return (
    <Box sx={{ p: 3, maxWidth: 1000, mx: 'auto' }}>
      <Typography variant='h4' component='h1' gutterBottom>
        Carga Masiva de Clientes
      </Typography>

      <Paper
        elevation={isDragging ? 8 : 2}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        sx={{
          p: 4,
          border: '2px dashed',
          borderColor: isDragging ? 'primary.main' : 'divider',
          backgroundColor: isDragging ? 'action.hover' : 'background.paper',
          transition: 'all 0.3s ease',
          textAlign: 'center',
          mb: 4,
          minHeight: 200,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: 'action.hover'
          }
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <CloudUploadIcon color={isDragging ? 'primary' : 'action'} sx={{ fontSize: 64, mb: 2 }} />
        <Typography variant='h6' gutterBottom>
          Arrastra y suelta tu archivo de Excel aquí
        </Typography>
        <Typography variant='body2' color='text.secondary' paragraph>
          O haz clic para seleccionar un archivo
        </Typography>
        <Stack direction='row' spacing={2} alignItems='center' sx={{ mt: 2 }}>
          <Button
            variant='contained'
            startIcon={<CloudUploadIcon />}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'Subiendo...' : 'Seleccionar archivo'}
          </Button>
          {uploading && <CircularProgress size={24} />}
        </Stack>
        <input
          ref={fileInputRef}
          type='file'
          hidden
          onChange={handleFileChange}
          accept={[
            '.csv',
            '.xls',
            '.xlsx',
            'text/csv',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          ].join(',')}
        />
      </Paper>

      {error && (
        <Alert severity='error' sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity='success' sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Paper elevation={2} sx={{ p: 4 }}>
        <Box display='flex' justifyContent='space-between' alignItems='center' mb={2}>
          <Typography variant='h5' gutterBottom sx={{ mb: 0 }}>
            Instrucciones
          </Typography>
          <Button variant='outlined' startIcon={<CloudDownloadIcon />} href='/plantilla-carga-clientes.xlsx' download>
            Descargar plantilla
          </Button>
        </Box>

        <Stack spacing={2} mt={2}>
          <Box>
            <Typography variant='subtitle1' fontWeight='medium'>
              1. Prepara tu archivo
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Asegúrate de que tu archivo Excel contenga las siguientes columnas:
            </Typography>
            <Paper
              variant='outlined'
              sx={{
                p: 2,
                mt: 1,
                bgcolor: 'background.default',
                overflowX: 'auto'
              }}
            >
              <Typography component='pre' sx={{ m: 0, fontFamily: 'monospace' }}>
                Tipo de Doc [V,J,G,P], Numero de doc Tipo de persona [N o J], Nombres/ Razon social, Apellidos,
                Direccion, Celular 1, Celular 2, Email 1, Email 2, Lugar de Nac/Fund
              </Typography>
            </Paper>
          </Box>

          <Box>
            <Typography variant='subtitle1' fontWeight='medium'>
              2. Formato de datos
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              - Tipo de documento acepta un carácter: V, J, G, P <br />- Tipo de persona acepta un carácter: N, J
            </Typography>
          </Box>

          <Box>
            <Typography variant='subtitle1' fontWeight='medium'>
              3. Ejemplo de datos
            </Typography>
            <Paper
              variant='outlined'
              sx={{
                p: 2,
                mt: 1,
                bgcolor: 'background.default',
                overflowX: 'auto'
              }}
            >
              <Typography component='pre' sx={{ m: 0, fontFamily: 'monospace' }}>
                V, 12345678, N, Juan Carlos, Pérez González, Calle Principal 123, 4241234567, 04169876543,
                juan@email.com, juan.work@email.com, Caracas
              </Typography>
            </Paper>
          </Box>
        </Stack>
      </Paper>
    </Box>
  )
}
