import {
  useActionState,
  useEffect,
  useOptimistic,
  useState,
  useTransition,
} from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Download,
  Link2,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  Unlink,
} from 'lucide-react'
import { api } from '../lib/api'
import { date, money } from '../lib/locale'
import { CustomFieldsEditor } from '../components/CustomFieldsEditor'
import {
  Empty,
  ErrorBox,
  Loading,
  PageHeader,
  Status,
  SubmitButton,
} from '../components/UI'

type Agreement = {
  id?: string
  unit?: { title?: string | null } | null
  tenant?: { fullName?: string | null } | null
  state?: string | null
  startDate?: string | null
  endDate?: string | null
  rentAmount?: unknown
  securityDeposit?: unknown
  rentInterval?: string | null
  billingAnchor?: string | null
  acceptedAt?: string | null
  acceptanceIp?: string | null
  publicUrl?: string | null
  renderedHtml?: string | null
}

type Reference = {
  id?: string
  title?: string | null
  fullName?: string | null
  name?: string | null
}

type References = {
  units: Reference[]
  tenants: Reference[]
  templates: Reference[]
}

const asArray = <T,>(value: unknown): T[] =>
  Array.isArray(value) ? value.filter((item) => item != null) : []

const responseItems = <T,>(value: unknown): T[] => {
  if (!value || typeof value !== 'object') return []
  return asArray<T>((value as { items?: unknown }).items)
}

const display = (value: unknown, fallback = '—') =>
  typeof value === 'string' || typeof value === 'number'
    ? String(value) || fallback
    : fallback

const formatDate = (value: unknown) => {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) return '—'
  return date(value)
}

const formatMoney = (value: unknown) =>
  value == null || value === '' ? '—' : money(value)

export function AgreementsPage() {
  const [items, setItems] = useState<Agreement[] | null>(null)
  const [error, setError] = useState<unknown>()
  useEffect(() => {
    api('/agreements?pageSize=100')
      .then((response) => setItems(responseItems<Agreement>(response)))
      .catch(setError)
  }, [])
  return (
    <>
      <PageHeader
        title="สัญญาเช่า"
        subtitle="ร่าง ส่ง ติดตาม และต่ออายุสัญญา"
        action={
          <Link className="primary" to="/agreements/new">
            <Plus size={18} />
            สร้างสัญญา
          </Link>
        }
      />
      {error ? (
        <ErrorBox error={error} />
      ) : !items ? (
        <Loading />
      ) : !items.length ? (
        <Empty title="ยังไม่มีสัญญา" />
      ) : (
        <div className="list-card">
          {items.map((item, index) => (
            <Link
              className="list-row"
              to={item.id ? `/agreements/${item.id}` : '/agreements'}
              key={item.id ?? index}
            >
              <div className="avatar paper">§</div>
              <div className="grow">
                <strong>{display(item.unit?.title, 'ไม่ระบุยูนิต')}</strong>
                <span>
                  {display(item.tenant?.fullName, 'ไม่ระบุผู้เช่า')} ·{' '}
                  {formatDate(item.startDate)} · {formatMoney(item.rentAmount)}
                </span>
              </div>
              <Status value={display(item.state, 'unknown')} />
              <span className="chevron">›</span>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}

export function NewAgreementPage() {
  const navigate = useNavigate()
  const [references, setReferences] = useState<References | null>(null)
  const [definitions, setDefinitions] = useState<any[]>([])
  const [customValues, setCustomValues] = useState<Record<string, unknown>>({})
  const [form, setForm] = useState<any>({
    billingAnchor: 'agreement_start',
    startDate: new Date().toISOString().slice(0, 10),
  })
  const [loadError, setLoadError] = useState<unknown>()
  useEffect(() => {
    Promise.all([
      api<any>('/units?pageSize=100'),
      api<any>('/tenants?pageSize=100'),
      api<any>('/agreement-templates?pageSize=100'),
      api<any>('/custom-fields?scope=agreement&pageSize=100'),
    ])
      .then(([units, tenants, templates, fields]) => {
        const unitItems = responseItems<Reference>(units)
        const tenantItems = responseItems<Reference>(tenants)
        const templateItems = responseItems<Reference>(templates)
        setReferences({
          units: unitItems,
          tenants: tenantItems,
          templates: templateItems,
        })
        setDefinitions(responseItems(fields))
        setForm((current: any) => ({
          ...current,
          unitId: unitItems[0]?.id,
          tenantId: tenantItems[0]?.id,
          templateId: templateItems[0]?.id,
        }))
      })
      .catch(setLoadError)
  }, [])
  const [submitError, submitAction, isSubmitting] = useActionState(
    async (_previousError: unknown) => {
      try {
        const agreement = await api<any>('/agreements', {
          method: 'POST',
          body: JSON.stringify(form),
        })
        if (!agreement?.id) throw new Error('ระบบไม่ได้ส่งรหัสสัญญากลับมา')
        if (definitions.length)
          await api(`/custom-field-values/agreement/${agreement.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ values: customValues }),
          })
        navigate(`/agreements/${agreement.id}`)
        return undefined
      } catch (submitError) {
        return submitError
      }
    },
    undefined,
  )
  const error = (!isSubmitting && submitError) || loadError
  return (
    <>
      <PageHeader
        title="สร้างสัญญาเช่า"
        subtitle="เลือกยูนิต ผู้เช่า แม่แบบ และกำหนดเงื่อนไข"
      />
      {error && <ErrorBox error={error} />}
      {!references ? (
        <Loading />
      ) : (
        <form className="form-card two-col" action={submitAction}>
          <label>
            ยูนิต
            <select
              required
              value={form.unitId ?? ''}
              onChange={(event) =>
                setForm({ ...form, unitId: event.target.value })
              }
            >
              {references.units.map((item, index) => (
                <option key={item.id ?? index} value={item.id ?? ''}>
                  {display(item.title, 'ไม่ระบุยูนิต')}
                </option>
              ))}
            </select>
          </label>
          <label>
            ผู้เช่า
            <select
              required
              value={form.tenantId ?? ''}
              onChange={(event) =>
                setForm({ ...form, tenantId: event.target.value })
              }
            >
              {references.tenants.map((item, index) => (
                <option key={item.id ?? index} value={item.id ?? ''}>
                  {display(item.fullName, 'ไม่ระบุผู้เช่า')}
                </option>
              ))}
            </select>
          </label>
          <label className="span-2">
            แม่แบบ
            <select
              required
              value={form.templateId ?? ''}
              onChange={(event) =>
                setForm({ ...form, templateId: event.target.value })
              }
            >
              {references.templates.map((item, index) => (
                <option key={item.id ?? index} value={item.id ?? ''}>
                  {display(item.name, 'ไม่ระบุแม่แบบ')}
                </option>
              ))}
            </select>
          </label>
          <label>
            วันเริ่มสัญญา
            <input
              required
              type="date"
              value={form.startDate ?? ''}
              onChange={(event) =>
                setForm({ ...form, startDate: event.target.value })
              }
            />
          </label>
          <label>
            วันสิ้นสุด
            <input
              type="date"
              value={form.endDate ?? ''}
              onChange={(event) =>
                setForm({ ...form, endDate: event.target.value })
              }
            />
          </label>
          <label>
            รอบวางบิล
            <select
              value={form.billingAnchor ?? 'agreement_start'}
              onChange={(event) =>
                setForm({ ...form, billingAnchor: event.target.value })
              }
            >
              <option value="agreement_start">วันครบรอบสัญญา</option>
              <option value="calendar">วันคงที่ในเดือน</option>
            </select>
          </label>
          {form.billingAnchor === 'calendar' && (
            <label>
              วันที่ครบกำหนด
              <input
                type="number"
                min="1"
                max="31"
                value={form.calendarDueDay ?? 1}
                onChange={(event) =>
                  setForm({
                    ...form,
                    calendarDueDay: Number(event.target.value),
                  })
                }
              />
            </label>
          )}
          <div className="span-2">
            <CustomFieldsEditor
              definitions={definitions}
              values={customValues}
              onChange={setCustomValues}
            />
          </div>
          <div className="form-actions span-2">
            <Link className="ghost" to="/agreements">
              ยกเลิก
            </Link>
            <SubmitButton
              disabled={
                !references.units.length ||
                !references.tenants.length ||
                !references.templates.length
              }
            >
              สร้างฉบับร่าง
            </SubmitButton>
          </div>
        </form>
      )}
    </>
  )
}

export function AgreementPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<Agreement | null>(null)
  const [definitions, setDefinitions] = useState<any[]>([])
  const [customValues, setCustomValues] = useState<Record<string, unknown>>({})
  const [error, setError] = useState<unknown>()
  const [isDeleting, setIsDeleting] = useState(false)
  const load = () => {
    if (!id) {
      setError(new Error('ไม่พบรหัสสัญญา'))
      return
    }
    return Promise.all([
      api<Agreement>(`/agreements/${id}`),
      api<unknown>(`/custom-field-values/agreement/${id}`),
    ])
      .then(([agreement, fields]) => {
        if (!agreement || typeof agreement !== 'object')
          throw new Error('ข้อมูลสัญญาที่ได้รับไม่สมบูรณ์')
        const fieldItems = asArray<{ id?: string; value?: unknown }>(fields)
        setData(agreement)
        setDefinitions(fieldItems)
        setCustomValues(
          Object.fromEntries(
            fieldItems
              .filter((item) => typeof item.id === 'string')
              .map((item) => [item.id, item.value]),
          ),
        )
      })
      .catch(setError)
  }
  useEffect(() => {
    load()
  }, [id])
  async function persistCustomFields() {
    if (!id || data?.state !== 'draft' || definitions.length === 0)
      return definitions
    const response = await api<unknown>(`/custom-field-values/agreement/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ values: customValues }),
    })
    const fields = asArray(response)
    setDefinitions(fields)
    return fields
  }
  async function send() {
    if (!confirm('เมื่อส่งแล้ว สัญญาจะไม่สามารถแก้ไขได้ ยืนยันหรือไม่?')) return
    try {
      await persistCustomFields()
      const agreement = await api<Agreement>(`/agreements/${id}/send`, {
        method: 'POST',
      })
      if (!agreement || typeof agreement !== 'object')
        throw new Error('ข้อมูลสัญญาที่ได้รับไม่สมบูรณ์')
      setData(agreement)
    } catch (sendError) {
      setError(sendError)
    }
  }
  async function downloadPdf() {
    try {
      await persistCustomFields()
      const result = await api<{ downloadUrl: string }>(`/agreements/${id}/pdf`)
      if (!result?.downloadUrl)
        throw new Error('ระบบไม่ได้ส่งลิงก์ดาวน์โหลด PDF กลับมา')
      window.open(result.downloadUrl, '_blank', 'noopener,noreferrer')
    } catch (pdfError) {
      setError(pdfError)
    }
  }
  async function saveCustomFields() {
    try {
      await persistCustomFields()
    } catch (saveError) {
      setError(saveError)
    }
  }
  async function rotateUrl() {
    if (
      !confirm(
        data?.publicUrl
          ? 'ลิงก์เดิมจะใช้ไม่ได้ทันที ยืนยันการสร้างลิงก์ใหม่?'
          : 'สร้างลิงก์สาธารณะใหม่?',
      )
    )
      return
    try {
      const result = await api<{ publicUrl: string }>(
        `/agreements/${id}/public-url`,
        { method: 'POST' },
      )
      if (!result?.publicUrl)
        throw new Error('ระบบไม่ได้ส่งลิงก์สาธารณะกลับมา')
      setData((current) => ({ ...(current ?? {}), publicUrl: result.publicUrl }))
    } catch (rotateError) {
      setError(rotateError)
    }
  }
  async function revokeUrl() {
    if (
      !confirm('ยกเลิกลิงก์สาธารณะนี้? ผู้ที่มีลิงก์เดิมจะเปิดสัญญาไม่ได้อีก')
    )
      return
    try {
      await api(`/agreements/${id}/public-url`, { method: 'DELETE' })
      setData((current) => ({ ...(current ?? {}), publicUrl: null }))
    } catch (revokeError) {
      setError(revokeError)
    }
  }
  async function remove() {
    if (!confirm('ยืนยันการลบสัญญาฉบับร่างนี้? การดำเนินการนี้ย้อนกลับไม่ได้'))
      return
    setIsDeleting(true)
    setError(undefined)
    try {
      await api(`/agreements/${id}`, { method: 'DELETE' })
      navigate('/agreements')
    } catch (deleteError) {
      setError(deleteError)
      setIsDeleting(false)
    }
  }
  if (!data) return error ? <ErrorBox error={error} /> : <Loading />
  return (
    <>
      <PageHeader
        title={`สัญญา · ${display(data.unit?.title, 'ไม่ระบุยูนิต')}`}
        subtitle={`${display(data.tenant?.fullName, 'ไม่ระบุผู้เช่า')} · ${formatDate(data.startDate)}${data.endDate ? ` – ${formatDate(data.endDate)}` : ''}`}
        action={
          <div className="button-row">
            {data.state === 'draft' && (
              <button
                className="ghost danger"
                disabled={isDeleting}
                onClick={remove}
              >
                <Trash2 size={17} />
                {isDeleting ? 'กำลังลบ…' : 'ลบ'}
              </button>
            )}
            <button className="ghost" onClick={downloadPdf}>
              <Download size={17} />
              PDF
            </button>
            {data.state === 'draft' && (
              <button className="primary" onClick={send}>
                <Send size={17} />
                ส่งสัญญา
              </button>
            )}
          </div>
        }
      />
      {error && <ErrorBox error={error} />}
      <div className="detail-grid">
        <section className="detail-card">
          <div className="detail-title">
            <h3>รายละเอียดสัญญา</h3>
            <Status value={display(data.state, 'unknown')} />
          </div>
          <dl>
            <dt>ค่าเช่า</dt>
            <dd>{formatMoney(data.rentAmount)}</dd>
            <dt>เงินประกัน</dt>
            <dd>{formatMoney(data.securityDeposit)}</dd>
            <dt>รอบค่าเช่า</dt>
            <dd>{display(data.rentInterval)}</dd>
            <dt>หลักวางบิล</dt>
            <dd>{display(data.billingAnchor)}</dd>
            {data.acceptedAt && (
              <>
                <dt>ยอมรับเมื่อ</dt>
                <dd>{formatDate(data.acceptedAt)}</dd>
                <dt>IP</dt>
                <dd>{display(data.acceptanceIp)}</dd>
              </>
            )}
          </dl>
          {data.state === 'draft' && definitions.length > 0 && (
            <div className="agreement-custom-fields">
              <CustomFieldsEditor
                definitions={definitions}
                values={customValues}
                onChange={setCustomValues}
              />
              <button className="ghost" onClick={saveCustomFields}>
                บันทึกข้อมูลกำหนดเอง
              </button>
            </div>
          )}
        </section>
        <section className="detail-card">
          <h3>ลิงก์สาธารณะ</h3>
          {data.publicUrl ? (
            <>
              <div className="copy-box">{data.publicUrl}</div>
              <div className="button-row">
                <button
                  className="ghost"
                  onClick={() =>
                    navigator.clipboard?.writeText(data.publicUrl ?? '')
                  }
                >
                  <Link2 size={16} />
                  คัดลอก
                </button>
                <button className="ghost" onClick={rotateUrl}>
                  <RefreshCw size={16} />
                  สร้างใหม่
                </button>
                <button className="ghost danger" onClick={revokeUrl}>
                  <Unlink size={16} />
                  ยกเลิก
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="muted">ยังไม่มีลิงก์ที่ใช้งานอยู่</p>
              {data.state !== 'draft' && (
                <button className="ghost public-url-create" onClick={rotateUrl}>
                  <Link2 size={16} />
                  สร้างลิงก์
                </button>
              )}
            </>
          )}
        </section>
      </div>
    </>
  )
}

export function PublicAgreementPage() {
  const { token } = useParams()
  const [data, setData] = useState<Agreement | null>(null)
  const [error, setError] = useState<unknown>()
  const [isDecisionPending, startDecision] = useTransition()
  const [optimisticState, setOptimisticState] = useOptimistic(
    data?.state as string | undefined,
    (_currentState, nextState: string) => nextState,
  )
  useEffect(() => {
    if (!token) {
      setError(new Error('ไม่พบลิงก์สัญญา'))
      return
    }
    api<Agreement>(`/public/agreements/${token}`)
      .then((agreement) => {
        if (!agreement || typeof agreement !== 'object')
          throw new Error('ข้อมูลสัญญาที่ได้รับไม่สมบูรณ์')
        setData(agreement)
      })
      .catch(setError)
  }, [token])
  function decide(action: 'accept' | 'reject') {
    if (!token) {
      setError(new Error('ไม่พบลิงก์สัญญา'))
      return
    }
    if (
      !confirm(
        action === 'accept' ? 'ยืนยันการยอมรับสัญญา?' : 'ยืนยันการปฏิเสธสัญญา?',
      )
    )
      return
    const nextState = action === 'accept' ? 'accepted' : 'rejected'
    startDecision(async () => {
      setOptimisticState(nextState)
      try {
        await api(`/public/agreements/${token}/${action}`, { method: 'POST' })
        setData((current) => ({ ...(current ?? {}), state: nextState }))
      } catch (decisionError) {
        setError(decisionError)
      }
    })
  }
  return (
    <div className="public-page">
      <header>
        <div className="brand">
          <span>R</span>Rentlord
        </div>
      </header>
      <main>
        {error ? (
          <ErrorBox error={error} />
        ) : !data ? (
          <Loading />
        ) : (
          <>
            <div className="public-heading">
              <p className="eyebrow">RENTAL AGREEMENT</p>
              <h1>สัญญาเช่า</h1>
              <Status
                value={display(optimisticState ?? data.state, 'unknown')}
              />
            </div>
            <article
              className="agreement-paper"
              dangerouslySetInnerHTML={{ __html: data.renderedHtml ?? '' }}
            />
            {data.state === 'sent' && (
              <div className="decision-bar">
                <button
                  className="ghost danger"
                  disabled={isDecisionPending}
                  onClick={() => decide('reject')}
                >
                  ปฏิเสธ
                </button>
                <button
                  className="primary"
                  disabled={isDecisionPending}
                  onClick={() => decide('accept')}
                >
                  ยอมรับสัญญา
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
