// Type Imports
import { ROUTES } from '@/constants/routes'
import type { VerticalMenuDataType } from '@/types/menuTypes'

const verticalMenuData = (): VerticalMenuDataType[] => [
  {
    label: 'Inicio',
    href: ROUTES.HOME,
    icon: 'ri-home-smile-line'
  },
  {
    label: 'Clientes',
    href: ROUTES.CLIENTS.INDEX,
    icon: 'ri-user-line'
  },
  {
    label: 'Pedidos',
    href: ROUTES.ORDERS.INDEX,
    icon: 'ri-file-list-3-line'
  },
  {
    label: 'Equipo',
    href: ROUTES.TEAM.INDEX,
    icon: 'ri-team-line'
  },
  {
    label: 'Info',
    href: ROUTES.ABOUT,
    icon: 'ri-information-line'
  }
]

export default verticalMenuData
