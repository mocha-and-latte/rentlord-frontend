import { ChangeEvent, useActionState, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ImagePlus, MessageCircle, Plus, Search, Trash2, X } from 'lucide-react'
import { api } from '../lib/api'
import { money } from '../lib/locale'
import { supabase } from '../lib/supabase'
import {
  Empty,
  ErrorBox,
  Loading,
  PageHeader,
  Status,
  SubmitButton,
} from '../components/UI'
import { CustomFieldsEditor } from '../components/CustomFieldsEditor'
import { RichTextEditor } from '../components/RichTextEditor'

type Kind = 'units' | 'tenants' | 'custom-fields' | 'agreement-templates'
type UnitImage = { path: string; url: string }
type LineLink = { linkableType: string; linkableId: string }

const config = {
  units: {
    title: 'ยูนิตให้เช่า',
    subtitle: 'จัดการบ้าน ห้อง และพื้นที่ให้เช่าทั้งหมด',
    name: (x: any) => x.title,
    detail: (x: any) =>
      `${x.address} · ${money(x.rentAmount)}/${x.rentInterval}`,
    fields: [
      ['title', 'ชื่อยูนิต', 'text'],
      ['address', 'ที่อยู่', 'textarea'],
      ['rentAmount', 'ค่าเช่า', 'number'],
      ['rentInterval', 'รอบค่าเช่า', 'select:daily,monthly,yearly'],
      ['securityDeposit', 'เงินประกัน', 'number'],
      ['status', 'สถานะ', 'select:available,occupied,inactive'],
    ],
  },
  tenants: {
    title: 'ผู้เช่า',
    subtitle: 'ข้อมูลติดต่อและประวัติสัญญาของผู้เช่า',
    name: (x: any) => x.fullName,
    detail: (x: any) =>
      [x.phone, x.email].filter(Boolean).join(' · ') || 'ยังไม่มีข้อมูลติดต่อ',
    fields: [
      ['fullName', 'ชื่อ-นามสกุล', 'text'],
      ['phone', 'เบอร์โทรศัพท์', 'tel'],
      ['email', 'อีเมล', 'email'],
      ['address', 'ที่อยู่', 'textarea'],
      ['notes', 'บันทึก', 'textarea'],
    ],
  },
  'custom-fields': {
    title: 'ฟิลด์กำหนดเอง',
    subtitle: 'เพิ่มข้อมูลเฉพาะที่เหมาะกับธุรกิจของคุณ',
    name: (x: any) => x.label,
    detail: (x: any) => `${x.scope} · ${x.fieldType}`,
    fields: [
      ['label', 'ชื่อฟิลด์', 'text'],
      ['key', 'คีย์', 'text'],
      ['scope', 'ใช้กับ', 'select:unit,tenant,agreement'],
      ['fieldType', 'ชนิดข้อมูล', 'select:text,number,date,select,checkbox'],
      ['options', 'ตัวเลือก (คั่นด้วยจุลภาค)', 'options'],
      ['isRequired', 'จำเป็นต้องกรอก', 'checkbox'],
      ['sortOrder', 'ลำดับ', 'number'],
    ],
  },
  'agreement-templates': {
    title: 'แม่แบบสัญญา',
    subtitle: 'จัดรูปแบบเอกสารสัญญาและเลือกใช้ตัวแปรอัตโนมัติ',
    name: (x: any) => x.name,
    detail: (x: any) => x.status,
    fields: [
      ['name', 'ชื่อแม่แบบ', 'text'],
      ['contentHtml', 'เนื้อหาสัญญา', 'textarea'],
      ['status', 'สถานะ', 'select:active,archived'],
    ],
  },
} as const

export function ResourceList({ kind }: { kind: Kind }) {
  const c = config[kind]
  const [data, setData] = useState<any>()
  const [linkedTenantIds, setLinkedTenantIds] = useState<Set<string>>(new Set())
  const [error, setError] = useState<unknown>()
  const [q, setQ] = useState('')
  useEffect(() => {
    setData(undefined)
    setError(undefined)
    const recordsRequest = api(`/${kind}?pageSize=100`)
    const lineLinksRequest =
      kind === 'tenants' ? api<LineLink[]>('/line-links') : Promise.resolve([])
    Promise.all([recordsRequest, lineLinksRequest])
      .then(([records, lineLinks]) => {
        setData(records)
        setLinkedTenantIds(
          new Set(
            lineLinks
              .filter((link) => link.linkableType === 'tenant')
              .map((link) => link.linkableId),
          ),
        )
      })
      .catch(setError)
  }, [kind])
  const items = (data?.items || []).filter((x: any) =>
    JSON.stringify(x).toLowerCase().includes(q.toLowerCase()),
  )
  return (
    <>
      <PageHeader
        title={c.title}
        subtitle={c.subtitle}
        action={
          <div className="button-row">
            {kind === 'tenants' && (
              <Link className="ghost" to="/tenants/invite">
                <MessageCircle size={18} />
                เชิญผ่าน LINE
              </Link>
            )}
            <Link className="primary" to={`/${kind}/new`}>
              <Plus size={18} />
              เพิ่มรายการ
            </Link>
          </div>
        }
      />
      <div className="toolbar">
        <div className="search">
          <Search size={18} />
          <input
            placeholder="ค้นหา…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <span className="muted">{items.length} รายการ</span>
      </div>
      {error ? (
        <ErrorBox error={error} />
      ) : !data ? (
        <Loading />
      ) : !items.length ? (
        <Empty />
      ) : (
        <div className="list-card">
          {items.map((item: any) => (
            <Link className="list-row" to={`/${kind}/${item.id}`} key={item.id}>
              <div className="avatar">{String(c.name(item)).slice(0, 1)}</div>
              <div className="grow">
                <strong className="list-row-title">
                  {c.name(item)}
                  {kind === 'tenants' && linkedTenantIds.has(item.id) && (
                    <span
                      className="line-linked-icon"
                      aria-label="ผูกบัญชี LINE แล้ว"
                      title="ผูกบัญชี LINE แล้ว"
                    >
                      <MessageCircle size={13} fill="currentColor" />
                    </span>
                  )}
                </strong>
                <span>{c.detail(item)}</span>
              </div>
              {item.status && <Status value={item.status} />}
              <span className="chevron">›</span>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}

export function ResourceForm({ kind }: { kind: Kind }) {
  const { id } = useParams()
  const isNew = !id
  const c = config[kind]
  const nav = useNavigate()
  const [form, setForm] = useState<Record<string, any>>(() =>
    Object.fromEntries(
      c.fields.map((f) => [
        f[0],
        f[2].startsWith('select:') ? f[2].split(':')[1].split(',')[0] : '',
      ]),
    ),
  )
  const [images, setImages] = useState<UnitImage[]>([])
  const [loading, setLoading] = useState(!isNew)
  const [imageBusy, setImageBusy] = useState(false)
  const [error, setError] = useState<unknown>()
  const [customDefinitions, setCustomDefinitions] = useState<any[]>([])
  const [customValues, setCustomValues] = useState<Record<string, unknown>>({})

  useEffect(() => {
    if (!id) return
    const requests: Promise<any>[] = [api(`/${kind}/${id}`)]
    if (kind === 'units') requests.push(api(`/units/${id}/images`))
    Promise.all(requests)
      .then(([record, unitImages]) => {
        setForm(record)
        if (unitImages) setImages(unitImages)
        setLoading(false)
      })
      .catch((e) => {
        setError(e)
        setLoading(false)
      })
  }, [id, kind])

  useEffect(() => {
    const scope =
      kind === 'units' ? 'unit' : kind === 'tenants' ? 'tenant' : null
    if (!scope) return
    api<any>(`/custom-fields?scope=${scope}&pageSize=100`)
      .then((result) => setCustomDefinitions(result.items))
      .catch(setError)
    if (id)
      api<any[]>(`/custom-field-values/${scope}/${id}`)
        .then((items) =>
          setCustomValues(
            Object.fromEntries(items.map((item) => [item.id, item.value])),
          ),
        )
        .catch(setError)
  }, [id, kind])

  const [submitError, submitAction, isSubmitting] = useActionState(
    async (_previousError: unknown) => {
      setError(undefined)
      try {
        const payload =
          kind === 'custom-fields'
            ? {
                ...form,
                options: Array.isArray(form.options)
                  ? form.options
                  : String(form.options ?? '')
                      .split(',')
                      .map((value) => value.trim())
                      .filter(Boolean),
                isRequired: Boolean(form.isRequired),
              }
            : form
        const record = await api<any>(`/${kind}${isNew ? '' : `/${id}`}`, {
          method: isNew ? 'POST' : 'PATCH',
          body: JSON.stringify(payload),
        })
        const scope =
          kind === 'units' ? 'unit' : kind === 'tenants' ? 'tenant' : null
        if (scope && customDefinitions.length)
          await api(`/custom-field-values/${scope}/${record.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ values: customValues }),
          })
        nav(`/${kind}`)
        return undefined
      } catch (e) {
        return e
      }
    },
    undefined,
  )

  async function uploadImage(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !id) return
    setImageBusy(true)
    setError(undefined)
    try {
      const upload = await api<{ path: string; token: string }>(
        `/units/${id}/images`,
        {
          method: 'POST',
          body: JSON.stringify({ contentType: file.type, size: file.size }),
        },
      )
      const bucket = import.meta.env.VITE_STORAGE_BUCKET_IMAGES || 'images'
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .uploadToSignedUrl(upload.path, upload.token, file, {
          contentType: file.type,
        })
      if (uploadError) throw uploadError
      await api(`/units/${id}/images`, {
        method: 'POST',
        body: JSON.stringify({ path: upload.path }),
      })
      setImages(await api(`/units/${id}/images`))
    } catch (e) {
      setError(e)
    } finally {
      setImageBusy(false)
    }
  }

  async function deleteImage(path: string) {
    if (!id || !confirm('ลบรูปนี้ออกจากยูนิต?')) return
    setImageBusy(true)
    setError(undefined)
    try {
      await api(`/units/${id}/images/${encodeURIComponent(path)}`, {
        method: 'DELETE',
      })
      setImages((current) => current.filter((image) => image.path !== path))
    } catch (e) {
      setError(e)
    } finally {
      setImageBusy(false)
    }
  }

  async function remove() {
    if (!id) return
    let message = 'ยืนยันการลบรายการนี้? การดำเนินการนี้ย้อนกลับไม่ได้'
    if (kind === 'custom-fields') {
      try {
        const impact = await api<any>(`/custom-fields/${id}/impact`)
        message = `ฟิลด์นี้มีค่าอยู่ ${impact.valueCount} รายการ ถูกใช้ในแม่แบบ ${impact.templateCount} รายการ และ snapshot สัญญา ${impact.agreementCount} ฉบับ\n\nเมื่อลบ ค่าที่กรอกไว้จะถูกลบและตัวแปร ${impact.token} ในเอกสารจะแสดงว่าง ยืนยันหรือไม่?`
      } catch (e) {
        setError(e)
        return
      }
    }
    if (!confirm(message)) return
    try {
      await api(`/${kind}/${id}`, { method: 'DELETE' })
      nav(`/${kind}`)
    } catch (e) {
      setError(e)
    }
  }

  if (loading) return <Loading />
  return (
    <>
      <PageHeader
        title={isNew ? `เพิ่ม${c.title}` : `แก้ไข${c.title}`}
        subtitle="กรอกข้อมูลให้ครบ แล้วกดบันทึก"
        action={
          !isNew && (
            <button className="ghost danger" onClick={remove}>
              <Trash2 size={17} />
              ลบ
            </button>
          )
        }
      />
      {((!isSubmitting && submitError) || error) && (
        <ErrorBox error={(!isSubmitting && submitError) || error} />
      )}
      <form className="form-card" action={submitAction}>
        {c.fields.map(([key, label, type]) =>
          key === 'contentHtml' ? (
            <div className="form-field" key={key}>
              <span className="form-field-label" id={`${key}-label`}>
                {label}
              </span>
              <RichTextEditor
                value={form[key] ?? ''}
                onChange={(value) =>
                  setForm((current) => ({ ...current, [key]: value }))
                }
                labelledBy={`${key}-label`}
              />
            </div>
          ) : type === 'textarea' ? (
            <label key={key}>
              {label}
              <textarea
                rows={3}
                value={form[key] ?? ''}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            </label>
          ) : type === 'checkbox' ? (
            <label className="checkbox-field" key={key}>
              <input
                type="checkbox"
                checked={Boolean(form[key])}
                onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
              />
              {label}
            </label>
          ) : type === 'options' ? (
            <label key={key}>
              {label}
              <input
                value={
                  Array.isArray(form[key])
                    ? form[key].join(', ')
                    : (form[key] ?? '')
                }
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                disabled={form.fieldType !== 'select'}
              />
            </label>
          ) : type.startsWith('select:') ? (
            <label key={key}>
              {label}
              <select
                value={form[key] ?? ''}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              >
                {type
                  .split(':')[1]
                  .split(',')
                  .map((v) => (
                    <option key={v}>{v}</option>
                  ))}
              </select>
            </label>
          ) : (
            <label key={key}>
              {label}
              <input
                type={type}
                min={type === 'number' ? 0 : undefined}
                value={form[key] ?? ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    [key]:
                      type === 'number'
                        ? Number(e.target.value)
                        : e.target.value,
                  })
                }
              />
            </label>
          ),
        )}
        <CustomFieldsEditor
          definitions={customDefinitions}
          values={customValues}
          onChange={setCustomValues}
        />
        {kind === 'units' && (
          <section className="unit-images">
            <div className="section-heading">
              <div>
                <strong>รูปยูนิต</strong>
                <p className="muted">JPEG, PNG หรือ WebP ขนาดไม่เกิน 10 MB</p>
              </div>
              {!isNew && (
                <label className="ghost upload-button">
                  <ImagePlus size={17} />
                  {imageBusy ? 'กำลังอัปโหลด…' : 'เพิ่มรูป'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={imageBusy}
                    onChange={uploadImage}
                  />
                </label>
              )}
            </div>
            {isNew ? (
              <div className="hint">
                บันทึกยูนิตก่อน แล้วจึงกลับมาเพิ่มรูปได้
              </div>
            ) : images.length ? (
              <div className="image-grid">
                {images.map((image) => (
                  <figure key={image.path}>
                    <img src={image.url} alt="รูปยูนิต" />
                    <button
                      type="button"
                      aria-label="ลบรูป"
                      disabled={imageBusy}
                      onClick={() => deleteImage(image.path)}
                    >
                      <X size={16} />
                    </button>
                  </figure>
                ))}
              </div>
            ) : (
              <div className="image-empty">ยังไม่มีรูปยูนิต</div>
            )}
          </section>
        )}
        {kind === 'agreement-templates' && (
          <div className="hint">
            ตัวแปร:{' '}
            {
              '{{tenant_full_name}} · {{unit_title}} · {{rent_amount}} · {{agreement_start_date}}'
            }
          </div>
        )}
        <div className="form-actions">
          <Link className="ghost" to={`/${kind}`}>
            ยกเลิก
          </Link>
          <SubmitButton>บันทึก</SubmitButton>
        </div>
      </form>
    </>
  )
}
