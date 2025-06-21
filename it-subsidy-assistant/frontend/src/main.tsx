import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import SubsidyAssistantApp from './SubsidyAssistantApp.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SubsidyAssistantApp />
  </StrictMode>,
)
