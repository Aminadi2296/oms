'use client'

import React, { useCallback, useMemo, useState } from 'react'

import Link from 'next/link'

import { Box, Typography, Button, Paper, CircularProgress, Tooltip, Menu, MenuItem } from '@mui/material'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import { useSession } from 'next-auth/react'

import { SearchBar, DataTable } from '@/components/common'
import { CLIENTS_PAGE } from '@/constants/texts'
import { ROUTES } from '@/constants/routes'
import { useClients } from '@/hooks/useClients'
import { useClientSearch } from '@/hooks/useClientSearch'
import type { Client } from '@/types/client'

const formatFullName = (client: Client) =>
  client.client_type === 'J' ? client?.last_name : `${client.first_name || ''} ${client.last_name || ''}`.trim()

const ClientsPage = () => {
  const { status: sessionStatus } = useSession()
  const apiEnabled = sessionStatus === 'authenticated'

  const [search, setSearch] = useState('')
  const [searchPage, setSearchPage] = useState(1)

  const { data: clientsPaginated, loading, error, page, perPage, totalPages, setPage } = useClients(10, apiEnabled)

  const {
    results: searchResults,
    totalPages: searchTotalPages,
    loading: searchLoading,
    error: searchError
  } = useClientSearch(search, searchPage, perPage, apiEnabled)

  const showingSearch = search.trim().length > 0
  const clientsToShow = showingSearch ? searchResults : clientsPaginated

  const currentTotalPages = showingSearch ? searchTotalPages : totalPages || 1
  const currentPage = showingSearch ? searchPage : page
  const currentSetPage = showingSearch ? setSearchPage : setPage

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const columns = useMemo(
    () => [
      {
        key: 'id' as const,
        label: 'ID',
        render: (value: number) => `#${value}`
      },
      {
        key: 'document' as const,
        label: 'Documento',
        render: (_: any, client: Client) => (
          <Box>
            {client?.client_type}-{client?.document_number}
          </Box>
        )
      },
      {
        key: 'client' as const,
        label: 'Cliente',
        render: (_: any, client: Client) => (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              width: '250px',
              minWidth: '250px'
            }}
          >
            <Tooltip title={formatFullName(client)} placement='top-start' arrow>
              <Typography
                variant='body2'
                sx={{
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '100%'
                }}
              >
                {formatFullName(client)}
              </Typography>
            </Tooltip>

            <Typography
              variant='caption'
              sx={{
                fontSize: '0.8em',
                color: '#666',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '100%'
              }}
            >
              {client.email_1 || 'Sin correo'}
            </Typography>
          </Box>
        )
      },
      {
        key: 'type' as const,
        label: 'Tipo',
        render: (_: any, client: Client) => client?.person_type || ''
      },
      {
        key: 'birth_date' as const,
        label: 'Fecha Nac./Fund.',
        render: (date: string) => (date ? new Date(date).toLocaleDateString() : 'N/A')
      },
      {
        key: 'actions' as const,
        label: 'Acciones',
        render: (_: any, client: Client) => (
          <Button variant='outlined' color='primary' size='small' href={ROUTES.CLIENTS.DETAIL(client.id)}>
            Ver Detalles
          </Button>
        )
      }
    ],
    []
  )

  const handleSearch = useCallback(
    (query: string) => {
      setSearch(query)
      setSearchPage(1)
      setPage(1)
    },
    [setPage]
  )

  if (sessionStatus === 'loading') {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' minHeight='200px'>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Cargando sesión...</Typography>
      </Box>
    )
  }

  if (loading || searchLoading) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' minHeight='200px'>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>{showingSearch ? 'Buscando clientes...' : 'Cargando clientes...'}</Typography>
      </Box>
    )
  }

  if (error || searchError) {
    return <Typography color='error'>{error || searchError}</Typography>
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3
        }}
      >
        <Typography variant='h4' sx={{ mb: 3, fontWeight: 600 }}>
          {CLIENTS_PAGE.TITLE}
        </Typography>
        <div>
          <Button variant='contained' color='primary' endIcon={<ArrowDropDownIcon />} onClick={handleClick}>
            {CLIENTS_PAGE.CREATE_CLIENT}
          </Button>

          <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
            <MenuItem onClick={handleClose}>
              <Link href={ROUTES.CLIENTS.CREATE} style={{ textDecoration: 'none', color: 'inherit' }}>
                Crear cliente individual
              </Link>
            </MenuItem>
            <MenuItem onClick={handleClose}>
              <Link href={ROUTES.CLIENTS.CREATE_BULK} style={{ textDecoration: 'none', color: 'inherit' }}>
                Crear cliente masivo
              </Link>
            </MenuItem>
          </Menu>
        </div>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <SearchBar
          placeholder={CLIENTS_PAGE.SEARCH_PLACEHOLDER}
          value={search}
          onChange={handleSearch}
          onClear={() => {
            setSearch('')
            setSearchPage(1)
            setPage(1)
          }}
          delay={400}
        />
      </Paper>

      <Box sx={{ mt: 2 }}>
        <DataTable
          columns={columns}
          rows={clientsToShow}
          emptyMessage={CLIENTS_PAGE.NO_RESULTS}
          page={currentPage}
          onPageChange={currentSetPage}
          itemsPerPage={perPage}
          totalPages={currentTotalPages}
          paginateLocally={false}
        />
      </Box>
    </Box>
  )
}

export default ClientsPage
