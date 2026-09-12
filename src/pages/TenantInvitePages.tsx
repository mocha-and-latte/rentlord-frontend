import { FormEvent, useEffect, useState } from 'react'
import { CheckCircle2, Copy, MessageCircle, Send } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { PublicAgreementPage } from './AgreementPages'
import { ErrorBox, Loading, PageHeader } from '../components/UI'

type CreatedInvite = {
  id: string
  tenant: { id: string; fullName: string }
  inviteUrl: string
  expiresAt: string
}

type InviteDetails = {
  tenantName: string
  landlordName: string
  expiresAt: string
}

type LiffClient = typeof import('@line/liff')['default']

export function NewTenantInvitePage() {
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  })
  const [invite, setInvite] = useState<CreatedInvite>()
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<unknown>()

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(undefined)
    try {
      setInvite(
        await api<CreatedInvite>('/tenant-invites', {
          method: 'POST',
          body: JSON.stringify(form),
        }),
      )
    } catch (submitError) {
      setError(submitError)
    } finally {
      setSubmitting(false)
    }
  }

  async function copyInvite() {
    if (!invite) return
    try {
      await navigator.clipboard.writeText(invite.inviteUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch (copyError) {
      setError(copyError)
    }
  }

  if (invite) {
    const shareText = `คุณได้รับคำเชิญจาก Rentlord สำหรับ ${invite.tenant.fullName}\nกรุณาเข้าสู่ระบบด้วย LINE ภายใน 3 วัน\n${invite.inviteUrl}`
    const shareUrl = `https://line.me/R/share?text=${encodeURIComponent(shareText)}`
    return (
      <>
        <PageHeader
          title="สร้างคำเชิญแล้ว"
          subtitle={`ส่งลิงก์นี้ให้ ${invite.tenant.fullName} ผ่าน LINE`}
        />
        <section className="form-card invite-result">
          <div className="invite-success-icon">
            <CheckCircle2 size={32} />
          </div>
          <div>
            <h2>พร้อมส่งคำเชิญ</h2>
            <p className="muted">
              ลิงก์ใช้ได้ครั้งเดียวและหมดอายุวันที่{' '}
              {new Date(invite.expiresAt).toLocaleString('th-TH')}
            </p>
          </div>
          <div className="copy-box">{invite.inviteUrl}</div>
          <div className="button-row">
            <button className="ghost" type="button" onClick={copyInvite}>
              <Copy size={17} />
              {copied ? 'คัดลอกแล้ว' : 'คัดลอกลิงก์'}
            </button>
            <a
              className="line-share-button"
              href={shareUrl}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle size={17} />
              ส่งผ่าน LINE
            </a>
          </div>
          <div className="form-actions">
            <Link className="ghost" to={`/tenants/${invite.tenant.id}`}>
              ดูข้อมูลผู้เช่า
            </Link>
            <button
              className="primary"
              type="button"
              onClick={() => setInvite(undefined)}
            >
              เชิญผู้เช่าคนอื่น
            </button>
          </div>
        </section>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="เชิญผู้เช่าผ่าน LINE"
        subtitle="สร้างผู้เช่าใหม่และส่งลิงก์สำหรับผูกบัญชีอัตโนมัติ"
      />
      {error && <ErrorBox error={error} />}
      <form className="form-card" onSubmit={submit}>
        <div className="hint">
          ลิงก์คำเชิญจะใช้ได้เพียงครั้งเดียวและหมดอายุภายใน 3 วัน
        </div>
        <label>
          ชื่อ-นามสกุล
          <input
            required
            value={form.fullName}
            onChange={(event) =>
              setForm({ ...form, fullName: event.target.value })
            }
          />
        </label>
        <label>
          เบอร์โทรศัพท์
          <input
            type="tel"
            value={form.phone}
            onChange={(event) =>
              setForm({ ...form, phone: event.target.value })
            }
          />
        </label>
        <label>
          อีเมล
          <input
            type="email"
            value={form.email}
            onChange={(event) =>
              setForm({ ...form, email: event.target.value })
            }
          />
        </label>
        <label>
          ที่อยู่
          <textarea
            rows={3}
            value={form.address}
            onChange={(event) =>
              setForm({ ...form, address: event.target.value })
            }
          />
        </label>
        <label>
          บันทึก
          <textarea
            rows={3}
            value={form.notes}
            onChange={(event) =>
              setForm({ ...form, notes: event.target.value })
            }
          />
        </label>
        <div className="form-actions">
          <Link className="ghost" to="/tenants">
            ยกเลิก
          </Link>
          <button className="primary" disabled={submitting}>
            <Send size={17} />
            {submitting ? 'กำลังสร้าง…' : 'สร้างลิงก์คำเชิญ'}
          </button>
        </div>
      </form>
    </>
  )
}

export function PublicTenantInvitePage() {
  const { token: routeToken = '' } = useParams()
  const [token, setToken] = useState('')
  const [details, setDetails] = useState<InviteDetails>()
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [inLine, setInLine] = useState(false)
  const [liffClient, setLiffClient] = useState<LiffClient>()
  const [error, setError] = useState<unknown>()

  useEffect(() => {
    async function initializeInvite() {
      try {
        const liffId = import.meta.env.VITE_LINE_LIFF_ID
        if (!liffId) throw new Error('ยังไม่ได้ตั้งค่า LINE LIFF')
        const { default: initializedLiff } = await import('@line/liff')
        await initializedLiff.init({
          liffId,
          withLoginOnExternalBrowser: true,
        })
        setLiffClient(initializedLiff)
        setInLine(initializedLiff.isInClient())
        const inviteToken = routeToken || inviteTokenFromUrl()
        if (!inviteToken) throw new Error('ไม่พบรหัสคำเชิญ')
        setToken(inviteToken)
        setDetails(
          await api<InviteDetails>(
            `/public/tenant-invites/${encodeURIComponent(inviteToken)}`,
          ),
        )
      } catch (initializeError) {
        setError(initializeError)
      } finally {
        setLoading(false)
      }
    }
    void initializeInvite()
  }, [routeToken])

  async function loginWithLine() {
    setStarting(true)
    setError(undefined)
    try {
      if (!liffClient) throw new Error('LINE LIFF ยังไม่พร้อมใช้งาน')
      if (!liffClient.isLoggedIn()) {
        liffClient.login({ redirectUri: window.location.href })
        return
      }
      const idToken = liffClient.getIDToken()
      if (!idToken) throw new Error('LINE ไม่ได้ส่งข้อมูลยืนยันตัวตน')
      const actionLink = await api<string>(
        `/public/tenant-invites/${encodeURIComponent(token)}/accept`,
        {
          method: 'POST',
          body: JSON.stringify({ idToken }),
        },
      )
      window.location.assign(actionLink)
    } catch (loginError) {
      setError(loginError)
      setStarting(false)
    }
  }

  return (
    <div className="invite-public-page">
      <main className="invite-public-card">
        <div className="brand">
          <span>R</span>Rentlord
        </div>
        {loading ? (
          <Loading />
        ) : error ? (
          <>
            <p className="eyebrow">คำเชิญไม่พร้อมใช้งาน</p>
            <h1>ลิงก์หมดอายุหรือถูกใช้แล้ว</h1>
            <ErrorBox error={error} />
            <p className="muted">
              กรุณาติดต่อผู้ให้เช่าเพื่อขอลิงก์คำเชิญใหม่
            </p>
          </>
        ) : details ? (
          <>
            <p className="eyebrow">TENANT INVITATION</p>
            <h1>ยินดีต้อนรับ {details.tenantName}</h1>
            <p className="invite-lead">
              <strong>{details.landlordName}</strong> เชิญคุณเข้าร่วม Rentlord
              เพื่อเชื่อมข้อมูลผู้เช่าและรับข้อมูลผ่าน LINE
            </p>
            <div className="hint">
              เมื่อเข้าสู่ระบบ ระบบจะผูกบัญชี LINE
              ของคุณกับข้อมูลผู้เช่าโดยอัตโนมัติ ลิงก์นี้ใช้ได้ครั้งเดียวถึง{' '}
              {new Date(details.expiresAt).toLocaleString('th-TH')}
            </div>
            <p className="liff-context">
              {inLine
                ? 'กำลังเปิดผ่าน LINE — ไม่ต้องกรอกรหัสผ่านเพิ่มเติม'
                : 'ระบบจะเชื่อมต่อผ่าน LIFF ด้วยบัญชี LINE ของคุณ'}
            </p>
            <button
              className="line-button invite-line-button"
              onClick={loginWithLine}
              disabled={starting}
            >
              LINE{' '}
              <b>
                {starting
                  ? 'กำลังเชื่อมต่อ…'
                  : 'ตอบรับคำเชิญด้วย LINE'}
              </b>
            </button>
          </>
        ) : null}
      </main>
    </div>
  )
}

export function LiffEntryPage() {
  const agreementToken = liffParameterFromUrl('agreement')
  return agreementToken ? (
    <PublicAgreementPage tokenOverride={agreementToken} />
  ) : (
    <PublicTenantInvitePage />
  )
}

export function TenantInviteCompletePage() {
  const [closeLiff, setCloseLiff] = useState<() => void>()

  useEffect(() => {
    const liffId = import.meta.env.VITE_LINE_LIFF_ID
    if (!liffId) return
    void import('@line/liff')
      .then(async ({ default: initializedLiff }) => {
        await initializedLiff.init({ liffId })
        if (initializedLiff.isInClient())
          setCloseLiff(() => () => initializedLiff.closeWindow())
      })
      .catch(() => undefined)
  }, [])

  return (
    <div className="invite-public-page">
      <main className="invite-public-card complete">
        <div className="invite-success-icon">
          <CheckCircle2 size={38} />
        </div>
        <p className="eyebrow">เชื่อมต่อสำเร็จ</p>
        <h1>ตอบรับคำเชิญเรียบร้อยแล้ว</h1>
        <p className="muted">
          บัญชี Rentlord และ LINE ของคุณถูกผูกกับข้อมูลผู้เช่าแล้ว
          คุณสามารถปิดหน้านี้ได้
        </p>
        {closeLiff && (
          <button className="primary wide" onClick={closeLiff}>
            ปิดหน้าต่าง
          </button>
        )}
      </main>
    </div>
  )
}

function inviteTokenFromUrl() {
  return liffParameterFromUrl('invite')
}

function liffParameterFromUrl(name: string) {
  const params = new URLSearchParams(window.location.search)
  const directToken = params.get(name)
  if (directToken) return directToken
  const liffState = params.get('liff.state')
  if (!liffState) return ''
  try {
    return (
      new URL(liffState, window.location.origin).searchParams.get(name) ?? ''
    )
  } catch {
    return ''
  }
}
