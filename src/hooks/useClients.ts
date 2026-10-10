import { usePaginatedResource } from './usePaginatedResource'
import type { Client } from '@/types/client'

export function useClients(initialPerPage = 10, enabled = true) {
  return usePaginatedResource<Client>({
    endpoint: 'clients',
    dataKey: 'clients',
    initialPerPage,
    enabled
  })
}
