import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { date } from '../lib/locale'
import { Empty, ErrorBox, Loading, PageHeader, Status } from '../components/UI'
export function NotificationsPage() {
  const [data, setData] = useState<any>()
  const [error, setError] = useState<unknown>()
  useEffect(() => {
    api('/notifications?pageSize=100').then(setData).catch(setError)
  }, [])
  async function read(id: string) {
    await api(`/notifications/${id}/read`, { method: 'POST' })
    setData((d: any) => ({
      ...d,
      items: d.items.map((x: any) =>
        x.id === id ? { ...x, status: 'read' } : x,
      ),
    }))
  }
  return (
    <>
      <PageHeader
        title="การแจ้งเตือน"
        subtitle="ข่าวสาร กำหนดชำระ และรายการสำคัญ"
      />
      {error ? (
        <ErrorBox error={error} />
      ) : !data ? (
        <Loading />
      ) : !data.items.length ? (
        <Empty />
      ) : (
        <div className="list-card">
          {data.items.map((x: any) => (
            <button
              className="list-row notification-row"
              key={x.id}
              onClick={() => read(x.id)}
            >
              <span className={x.status === 'read' ? 'dot read' : 'dot'} />
              <div className="grow">
                <strong>{x.event.replaceAll('_', ' ')}</strong>
                <span>
                  {date(x.scheduledAt)} · {x.channel}
                </span>
              </div>
              <Status value={x.status} />
            </button>
          ))}
        </div>
      )}
    </>
  )
}
export function AdminPage() {
  const [data, setData] = useState<any>()
  const [error, setError] = useState<unknown>()
  useEffect(() => {
    api('/admin/dashboard').then(setData).catch(setError)
  }, [])
  return (
    <>
      <PageHeader title="ผู้ดูแลระบบ" subtitle="ภาพรวมการใช้งานทั้งระบบ" />
      {error ? (
        <ErrorBox error={error} />
      ) : !data ? (
        <Loading />
      ) : (
        <div className="metric-grid">
          {Object.entries(data).map(([k, v]) => (
            <div className="metric">
              <span>{k}</span>
              <strong>{String(v)}</strong>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
