import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { Providers } from '@/app/providers'
import { router } from '@/app/router'
import { ErrorBoundary } from '@/app/ErrorBoundary'
import { initCrossTabAuthSync } from '@/app/crossTabAuthSync'
import './index.css'

initCrossTabAuthSync()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Providers>
        <RouterProvider router={router} />
      </Providers>
    </ErrorBoundary>
  </React.StrictMode>
)
