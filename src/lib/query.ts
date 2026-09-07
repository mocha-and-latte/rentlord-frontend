import { QueryClient } from '@tanstack/react-query'
import { DbClient } from '@tanstack/react-db'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export const dbClient = new DbClient({ queryClient })
