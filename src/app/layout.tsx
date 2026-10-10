// MUI Imports
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript'

// Third-party Imports
import 'react-perfect-scrollbar/dist/css/styles.css'

// Type Imports
import type { ChildrenType } from '@core/types'

// Util Imports
import { getSystemMode } from '@core/utils/serverHelpers'
import { METADATA } from '@/constants/texts'

// Redux Provider
import { ReduxProvider } from '@/store/ReduxProvider'

// Style Imports
import '@/app/globals.css'

// Generated Icon CSS Imports
import '@assets/iconify-icons/generated-icons.css'

export const metadata = {
  title: {
    template: `%s | ${METADATA.layout.title}`,
    default: METADATA.layout.title // a default is required when creating a template
  },
  description: METADATA.layout.description
}

const RootLayout = async (props: ChildrenType) => {
  const { children } = props

  // Vars

  const systemMode = await getSystemMode()
  const direction = 'ltr'

  return (
    <html id='__next' lang='en' dir={direction} suppressHydrationWarning>
      <body className='flex is-full min-bs-full flex-auto flex-col'>
        <InitColorSchemeScript attribute='data' defaultMode={systemMode} />
        <ReduxProvider>{children}</ReduxProvider>
      </body>
    </html>
  )
}

export default RootLayout
