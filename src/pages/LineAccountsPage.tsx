import { useEffect, useState } from 'react'
import { Link2, MessageCircle, Trash2 } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import { ErrorBox, Loading, PageHeader } from '../components/UI'

export function LineAccountsPage() {
  const [searchParams] = useSearchParams()
  const [data, setData] = useState<any[]>()
  const [pin, setPin] = useState<any>()
  const [tenants, setTenants] = useState<any[]>([])
  const [target, setTarget] = useState('landlord')
  const [error, setError] = useState<unknown>()
  const load = () => api<any[]>('/line-links').then(setData).catch(setError)
  useEffect(() => {
    load()
    api<any>('/tenants?pageSize=100')
      .then((result) => setTenants(result.items))
      .catch(setError)
  }, [])
  const linkTarget =
    target === 'landlord'
      ? { targetType: 'landlord' }
      : { targetType: 'tenant', targetId: target }
  async function createPin() {
    try {
      setPin(
        await api('/line-links/pins', {
          method: 'POST',
          body: JSON.stringify(linkTarget),
        }),
      )
    } catch (createError) {
      setError(createError)
    }
  }
  async function connectLogin() {
    try {
      const result = await api<{ authorizationUrl: string }>(
        '/line-links/login-url',
        { method: 'POST', body: JSON.stringify(linkTarget) },
      )
      window.location.assign(result.authorizationUrl)
    } catch (connectError) {
      setError(connectError)
    }
  }
  async function unlink(id: string) {
    if (!confirm('ยืนยันยกเลิกการเชื่อมต่อ LINE?')) return
    try {
      await api(`/line-links/${id}/unlink`, { method: 'POST' })
      load()
    } catch (unlinkError) {
      setError(unlinkError)
    }
  }
  return (
    <>
      <PageHeader
        title="บัญชี LINE"
        subtitle="เชื่อมผ่าน LINE Login หรือ PIN และใช้งานเมนูใน Official Account"
        action={
          <div className="button-row">
            <button className="ghost" onClick={createPin}>
              <MessageCircle size={17} />
              สร้าง PIN
            </button>
            <button className="primary" onClick={connectLogin}>
              <Link2 size={17} />
              เชื่อมด้วย LINE Login
            </button>
          </div>
        }
      />
      <div className="line-target">
        <label>
          เชื่อม LINE ให้กับ
          <select
            value={target}
            onChange={(event) => setTarget(event.target.value)}
          >
            <option value="landlord">เจ้าของบ้าน (บัญชีของฉัน)</option>
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                ผู้เช่า: {tenant.fullName}
              </option>
            ))}
          </select>
        </label>
      </div>
      {searchParams.get('linked') === '1' && (
        <div className="success-box">เชื่อมบัญชี LINE สำเร็จแล้ว</div>
      )}
      {error && <ErrorBox error={error} />}
      {pin && (
        <div className="pin-card">
          <p>ส่งรหัสนี้ไปที่ LINE Official Account ภายใน 3 นาที</p>
          <strong>{pin.pin}</strong>
          <small>
            หมดอายุ {new Date(pin.expiresAt).toLocaleTimeString('th-TH')}
          </small>
        </div>
      )}
      {!data ? (
        <Loading />
      ) : (
        <div className="list-card">
          {data.map((item) => (
            <div className="list-row" key={item.id}>
              <div className="avatar line">L</div>
              <div className="grow">
                <strong>
                  {item.lineIdentity.displayName || 'LINE account'}
                </strong>
                <span>{item.linkableType}</span>
              </div>
              <button
                className="icon-button danger"
                onClick={() => unlink(item.id)}
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="hint line-help">
        ใน LINE พิมพ์ “เมนู” เพื่อดูใบแจ้งหนี้และยอดค้างชำระ
        บัญชีเจ้าของบ้านสามารถยืนยันรับชำระผ่าน action ของใบแจ้งหนี้ได้
      </div>
    </>
  )
}
