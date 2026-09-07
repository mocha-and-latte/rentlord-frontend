import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { DbProvider } from '@tanstack/react-db'
import { AuthProvider } from './lib/auth'
import { LocaleProvider } from './lib/locale'
import { dbClient, queryClient } from './lib/query'
import App from './App'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <DbProvider client={dbClient}>
        <BrowserRouter>
          <LocaleProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </LocaleProvider>
        </BrowserRouter>
      </DbProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
