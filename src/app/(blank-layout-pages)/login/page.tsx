// Next Imports
import type { Metadata } from 'next'

// Component Imports
import Login from '@views/Login'

import { LOGIN } from '@/constants/texts'

// Server Action Imports
import { getServerMode } from '@core/utils/serverHelpers'

export const metadata: Metadata = {
  ...LOGIN.metadata
}

const LoginPage = async () => {
  // Vars
  const mode = await getServerMode()

  return <Login mode={mode} />
}

export default LoginPage
