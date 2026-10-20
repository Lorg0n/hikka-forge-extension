import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/index.css'
import App from './page.tsx'
import { AuthProvider } from '@/contexts/AuthContext'
import { initializeIconCache } from '@/utils/icon-cache'

const browserNavigator = navigator as Navigator & {
  userAgentData?: { mobile?: boolean }
}
const isMobileBrowser = browserNavigator.userAgentData?.mobile ??
  /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
document.documentElement.toggleAttribute('data-popup-mobile', isMobileBrowser)

void initializeIconCache().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AuthProvider>
        <App />
      </AuthProvider>
    </StrictMode>,
  )
})
