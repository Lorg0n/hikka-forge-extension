import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/index.css'
import AlchemyPage from './AlchemyPage.tsx' 

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AlchemyPage />
  </StrictMode>,
)