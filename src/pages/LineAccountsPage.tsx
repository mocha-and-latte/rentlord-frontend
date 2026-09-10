import { useEffect, useState } from 'react'
import { Link2, MessageCircle, Trash2 } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import { ErrorBox, Loading, PageHeader } from '../components/UI'

type PinRequest = {
  id: string
  pin: string
  expiresAt: string
  status:
    | 'waiting_for_line'
    | 'waiting_for_confirmation'
    | 'confirmed'
    | 'expired'
}

export function LineAccountsPage() {
  const [searchParams] = useSearchParams()
  const [data, setData] = useState<any[]>()
  const [pin, setPin] = useState<PinRequest>()
  const [confirming, setConfirming] = useState(false)
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
  useEffect(() => {
    if (
      !pin?.id ||
      !['waiting_for_line', 'waiting_for_confirmation'].includes(pin.status)
    )
      return
    const poll = window.setInterval(async () => {
      try {
        const status = await api<Omit<PinRequest, 'pin'>>(
          `/line-links/pins/${pin.id}`,
        )
        setPin((current) =>
          current?.id === status.id ? { ...current, ...status } : current,
        )
      } catch (statusError) {
        setError(statusError)
      }
    }, 2000)
    return () => window.clearInterval(poll)
  }, [pin?.id, pin?.status])
  const linkTarget =
    target === 'landlord'
      ? { targetType: 'landlord' }
      : { targetType: 'tenant', targetId: target }
  async function createPin() {
    try {
      setError(undefined)
      setPin(
        await api<PinRequest>('/line-links/pins', {
          method: 'POST',
          body: JSON.stringify(linkTarget),
        }),
      )
    } catch (createError) {
      setError(createError)
    }
  }
  async function confirmPin() {
    if (!pin) return
    try {
      setConfirming(true)
      setError(undefined)
      await api(`/line-links/pins/${pin.id}/confirm`, { method: 'POST' })
      setPin({ ...pin, status: 'confirmed' })
      await load()
    } catch (confirmError) {
      setError(confirmError)
    } finally {
      setConfirming(false)
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
          {pin.status === 'waiting_for_line' && (
            <>
              <p>ส่งรหัสนี้ไปที่ LINE Official Account ภายใน 3 นาที</p>
              <strong>{pin.pin}</strong>
              <small>
                หมดอายุ {new Date(pin.expiresAt).toLocaleTimeString('th-TH')}
              </small>
              <small>หน้านี้จะตรวจคำขอจาก LINE ให้อัตโนมัติ</small>
            </>
          )}
          {pin.status === 'waiting_for_confirmation' && (
            <>
              <p>ได้รับ PIN จาก LINE แล้ว</p>
              <h3>พร้อมยืนยัน</h3>
              <small>ตรวจสอบว่าคุณเป็นผู้ส่ง PIN แล้วกดยืนยันด้านล่าง</small>
              <button
                className="primary"
                onClick={confirmPin}
                disabled={confirming}
              >
                {confirming ? 'กำลังยืนยัน…' : 'ยืนยันเชื่อมบัญชี LINE'}
              </button>
            </>
          )}
          {pin.status === 'confirmed' && (
            <div className="success-box">ยืนยันและเชื่อมบัญชี LINE สำเร็จแล้ว</div>
          )}
          {pin.status === 'expired' && (
            <>
              <p>PIN หมดอายุแล้ว</p>
              <button className="primary" onClick={createPin}>
                สร้าง PIN ใหม่
              </button>
            </>
          )}
        </div>
      )}
      {!data ? (
        <Loading />
      ) : (
        <div className="list-card">
          {data.length === 0 && <p className="muted center">ยังไม่มีบัญชี LINE ที่เชื่อมไว้</p>}
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
        ใน LINE พิมพ์ “เมนู” เพื่อดูใบแจ้งหนี้ ยอดค้างชำระ และสัญญา
        บัญชีเจ้าของบ้านสามารถยืนยันรับชำระผ่าน action ของใบแจ้งหนี้ได้
      </div>
    </>
  )
}
