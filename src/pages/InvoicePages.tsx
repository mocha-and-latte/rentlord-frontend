// @ts-nocheck
import { useActionState, useEffect, useState } from 'react'
import { useDbClient, useLiveQuery } from '@tanstack/react-db'
import { useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2, Plus, QrCode, Send, XCircle } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { invoiceCollectionOptions, invoiceQueryKey } from '../lib/invoices'
import { date, money } from '../lib/locale'
import {
  Empty,
  ErrorBox,
  Loading,
  PageHeader,
  Status,
  SubmitButton,
} from '../components/UI'

export function InvoicesPage() {
  const [status, setStatus] = useState('')
  const { session } = useAuth()
  const accountId = session?.user.id ?? 'anonymous'
  const invoicesCollection = useDbClient().collection(
    invoiceCollectionOptions(accountId),
  )
  const invoices = useLiveQuery({
    queryKey: [invoicesCollection.id, 'status', status],
    query: (q) =>
      q
        .from({ invoice: invoicesCollection })
        .fn.where(({ invoice }) => !status || invoice.status === status),
  })
  const error = invoicesCollection.utils.lastError
  return (
    <>
      <PageHeader
        title="ใบแจ้งหนี้"
        subtitle="ติดตามยอด กำหนดชำระ และสถานะการจ่าย"
        action={
          <Link className="primary" to="/invoices/new">
            <Plus size={18} />
            สร้างใบแจ้งหนี้
          </Link>
        }
      />
      <div className="toolbar">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">ทุกสถานะ</option>
          <option value="open">รอชำระ</option>
          <option value="overdue">เกินกำหนด</option>
          <option value="paid">ชำระแล้ว</option>
          <option value="cancelled">ยกเลิก</option>
        </select>
      </div>
      {error ? (
        <ErrorBox error={error} />
      ) : invoices.isLoading ? (
        <Loading />
      ) : !invoices.data.length ? (
        <Empty />
      ) : (
        <div className="list-card">
          {invoices.data.map((x) => (
            <Link className="list-row" to={`/invoices/${x.id}`} key={x.id}>
              <div className="avatar invoice">฿</div>
              <div className="grow">
                <strong>{x.invoiceNumber}</strong>
                <span>
                  {x.agreement.unit.title} · {x.agreement.tenant.fullName} ·
                  ครบกำหนด {date(x.dueDate)}
                </span>
              </div>
              <strong>{money(x.totalAmount)}</strong>
              <Status value={x.status} />
              <span className="chevron">›</span>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}

export function NewInvoicePage() {
  const nav = useNavigate()
  const queryClient = useQueryClient()
  const { session } = useAuth()
  const accountId = session?.user.id ?? 'anonymous'
  const [agreements, setAgreements] = useState<any[]>([])
  const [loadError, setLoadError] = useState<unknown>()
  const [form, setForm] = useState<any>({
    periodStart: new Date().toISOString().slice(0, 10),
    periodEnd: new Date().toISOString().slice(0, 10),
    dueDate: new Date().toISOString().slice(0, 10),
    items: [
      { kind: 'rent', description: 'ค่าเช่า', quantity: 1, unitAmount: 0 },
    ],
  })
  useEffect(() => {
    api<any>('/agreements?state=accepted&pageSize=100')
      .then((x) => {
        setAgreements(x.items)
        if (x.items[0])
          setForm((f: any) => ({
            ...f,
            agreementId: x.items[0].id,
            items: [
              { ...f.items[0], unitAmount: Number(x.items[0].rentAmount) },
            ],
          }))
      })
      .catch(setLoadError)
  }, [])
  const [submitError, submitAction, isSubmitting] = useActionState(
    async (_previousError: unknown) => {
      try {
        const x = await api<any>('/invoices', {
          method: 'POST',
          body: JSON.stringify(form),
        })
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: invoiceQueryKey(accountId),
          }),
          queryClient.invalidateQueries({
            queryKey: ['dashboard', accountId],
          }),
        ])
        nav(`/invoices/${x.id}`)
        return undefined
      } catch (e) {
        return e
      }
    },
    undefined,
  )
  const error = (!isSubmitting && submitError) || loadError
  return (
    <>
      <PageHeader
        title="สร้างใบแจ้งหนี้"
        subtitle="ระบบจะคำนวณยอดรวมจากรายการ"
      />
      {error && <ErrorBox error={error} />}
      <form className="form-card two-col" action={submitAction}>
        <label className="span-2">
          สัญญา
          <select
            value={form.agreementId || ''}
            onChange={(e) => setForm({ ...form, agreementId: e.target.value })}
          >
            {agreements.map((x) => (
              <option key={x.id} value={x.id}>
                {x.unit.title} · {x.tenant.fullName}
              </option>
            ))}
          </select>
        </label>
        <label>
          เริ่มรอบ
          <input
            type="date"
            value={form.periodStart}
            onChange={(e) => setForm({ ...form, periodStart: e.target.value })}
          />
        </label>
        <label>
          สิ้นสุดรอบ
          <input
            type="date"
            value={form.periodEnd}
            onChange={(e) => setForm({ ...form, periodEnd: e.target.value })}
          />
        </label>
        <label>
          ครบกำหนด
          <input
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          />
        </label>
        <label>
          จำนวนเงิน
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.items[0].unitAmount}
            onChange={(e) =>
              setForm({
                ...form,
                items: [
                  { ...form.items[0], unitAmount: Number(e.target.value) },
                ],
              })
            }
          />
        </label>
        <div className="form-actions span-2">
          <Link className="ghost" to="/invoices">
            ยกเลิก
          </Link>
          <SubmitButton disabled={!agreements.length}>
            สร้างใบแจ้งหนี้
          </SubmitButton>
        </div>
      </form>
    </>
  )
}

export function InvoicePage() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const { session } = useAuth()
  const accountId = session?.user.id ?? 'anonymous'
  const [data, setData] = useState<any>()
  const [error, setError] = useState<unknown>()
  const [qr, setQr] = useState('')
  const [sendingQr, setSendingQr] = useState(false)
  const [qrSent, setQrSent] = useState(false)
  const load = () => {
    api(`/invoices/${id}`).then(setData).catch(setError)
    return () => {}
  }
  useEffect(load, [id])
  async function getQr() {
    setQrSent(false)
    setError(undefined)
    try {
      const x = await api<any>(`/invoices/${id}/generate-qr`, {
        method: 'POST',
      })
      setQr(x.dataUrl)
    } catch (e) {
      setError(e)
    }
  }
  async function paid() {
    const method = prompt('วิธีชำระ: promptpay หรือ cash', 'promptpay')
    if (!method || !confirm(`ยืนยันรับชำระ ${money(data.totalAmount)}?`)) return
    try {
      const updated = await api(`/invoices/${id}/mark-paid`, {
        method: 'POST',
        body: JSON.stringify({ method }),
      })
      setData(updated)
      await invalidateInvoiceSummaries()
    } catch (e) {
      setError(e)
    }
  }
  async function sendQrToLine() {
    setSendingQr(true)
    setQrSent(false)
    setError(undefined)
    try {
      await api(`/invoices/${id}/send-qr-to-line`, { method: 'POST' })
      setQrSent(true)
    } catch (e) {
      setError(e)
    } finally {
      setSendingQr(false)
    }
  }
  async function cancel() {
    if (!confirm('ยืนยันยกเลิกใบแจ้งหนี้?')) return
    try {
      setData(await api(`/invoices/${id}/cancel`, { method: 'POST' }))
      await invalidateInvoiceSummaries()
    } catch (e) {
      setError(e)
    }
  }
  function invalidateInvoiceSummaries() {
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: invoiceQueryKey(accountId) }),
      queryClient.invalidateQueries({ queryKey: ['dashboard', accountId] }),
    ])
  }
  if (!data) return error ? <ErrorBox error={error} /> : <Loading />
  return (
    <>
      <PageHeader
        title={data.invoiceNumber}
        subtitle={`${data.agreement.unit.title} · ${data.agreement.tenant.fullName}`}
        action={<Status value={data.status} />}
      />
      {error && <ErrorBox error={error} />}
      <div className="detail-grid">
        <section className="detail-card">
          <h3>รายการ</h3>
          {data.items.map((x: any) => (
            <div className="item-line" key={x.id}>
              <span>
                {x.description}
                <small>
                  {x.quantity} × {money(x.unitAmount)}
                </small>
              </span>
              <strong>{money(x.amount)}</strong>
            </div>
          ))}
          <div className="total-line">
            <span>ยอดรวม</span>
            <strong>{money(data.totalAmount)}</strong>
          </div>
          <dl>
            <dt>รอบบิล</dt>
            <dd>
              {date(data.periodStart)} – {date(data.periodEnd)}
            </dd>
            <dt>ครบกำหนด</dt>
            <dd>{date(data.dueDate)}</dd>
            {data.paidAt && (
              <>
                <dt>ชำระเมื่อ</dt>
                <dd>{date(data.paidAt)}</dd>
              </>
            )}
          </dl>
        </section>
        <section className="detail-card center">
          <h3>PromptPay</h3>
          {qr ? (
            <img className="qr" src={qr} alt="PromptPay QR" />
          ) : (
            <div className="qr-placeholder">
              <QrCode size={70} />
              <p>สร้าง QR พร้อมยอดชำระ</p>
            </div>
          )}
          <div className="button-stack">
            {qr && (
              <button
                className="primary"
                onClick={sendQrToLine}
                disabled={sendingQr}
              >
                <Send size={17} />
                {sendingQr ? 'กำลังส่งเข้า LINE…' : 'ส่งรูปนี้เข้า LINE ที่ผูกไว้'}
              </button>
            )}
            {qrSent && (
              <div className="success-box">ส่ง QR เข้า LINE เรียบร้อยแล้ว</div>
            )}
            {!['paid', 'cancelled'].includes(data.status) && (
              <>
                <button className="ghost" onClick={getQr}>
                  <QrCode size={17} />
                  สร้าง QR
                </button>
                <button className="primary" onClick={paid}>
                  <CheckCircle2 size={17} />
                  ยืนยันรับชำระ
                </button>
                <button className="text-button danger" onClick={cancel}>
                  <XCircle size={17} />
                  ยกเลิกใบแจ้งหนี้
                </button>
              </>
            )}
          </div>
        </section>
      </div>
    </>
  )
}
