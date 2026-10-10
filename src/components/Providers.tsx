// Type Imports
import type { ChildrenType, Direction } from '@core/types'

// Context Imports
import { VerticalNavProvider } from '@menu/contexts/verticalNavContext'
import { SettingsProvider } from '@core/contexts/settingsContext'
import ThemeProvider from '@components/theme'
import { PageNavProvider } from '@/context/PageNavContext'

// Util Imports
import { getMode, getSettingsFromCookie, getSystemMode } from '@core/utils/serverHelpers'
import { SessionProvider } from '@/context/sessionContext'
import { SessionExpiredProvider } from '@/context/SessionExpiredContext'
import SessionExpiredModal from './SessionExpiredModal'
import { SnackbarProvider } from '@/context/SnackBarContext'
import { ToastProvider } from '@/context/ToastContext'

type Props = ChildrenType & {
  direction: Direction
}

const Providers = async (props: Props) => {
  // Props
  const { children, direction } = props

  // Vars
  const mode = await getMode()
  const settingsCookie = await getSettingsFromCookie()
  const systemMode = await getSystemMode()

  return (
    <VerticalNavProvider>
      <SettingsProvider settingsCookie={settingsCookie} mode={mode}>
        <ThemeProvider direction={direction} systemMode={systemMode}>
          <SnackbarProvider>
            <ToastProvider>
              <SessionProvider>
                <SessionExpiredProvider>
                  <PageNavProvider>
                    <SessionExpiredModal />
                    {children}
                  </PageNavProvider>
                </SessionExpiredProvider>
              </SessionProvider>
            </ToastProvider>
          </SnackbarProvider>
        </ThemeProvider>
      </SettingsProvider>
    </VerticalNavProvider>
  )
}

export default Providers
