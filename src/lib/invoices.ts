import { collectionOptions, type DbClient } from '@tanstack/react-db'
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { QueryClient } from '@tanstack/react-query'
import { api } from './api'

export type InvoiceListItem = {
  id: string
  invoiceNumber: string
  dueDate: string
  totalAmount: number | string
  status: string
  agreement: {
    unit: { title: string }
    tenant: { fullName: string }
  }
}

type InvoiceListResponse = {
  items: InvoiceListItem[]
}

export const invoiceQueryKey = (accountId: string) =>
  ['invoices', accountId] as const

export function invoiceCollectionOptions(accountId: string) {
  return collectionOptions(`invoices:${accountId}`, (client: DbClient) =>
    queryCollectionOptions({
      queryKey: invoiceQueryKey(accountId),
      queryClient: client.requireDependency<QueryClient>('queryClient'),
      queryFn: ({ signal }) =>
        api<InvoiceListResponse>('/invoices?pageSize=100', { signal }),
      select: (response) => response.items,
      getKey: (invoice) => invoice.id,
      staleTime: 30_000,
    }),
  )
}
