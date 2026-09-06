import { ReactNode } from 'react'
import { useFormStatus } from 'react-dom'
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
export function Empty({
  title = 'ยังไม่มีข้อมูล',
  text = 'เริ่มต้นด้วยการเพิ่มรายการแรกของคุณ',
}: {
  title?: string
  text?: string
}) {
  return (
    <div className="empty">
      <div className="empty-mark">R</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  )
}
export function ErrorBox({ error }: { error: unknown }) {
  return (
    <div className="error-box">
      {error instanceof Error ? error.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่'}
    </div>
  )
}
export function Loading() {
  return (
    <div className="loading">
      <i />
      <i />
      <i />
    </div>
  )
}
export function Status({ value }: { value: string }) {
  return <span className={`status ${value}`}>{value}</span>
}

export function SubmitButton({
  children,
  pendingLabel = 'กำลังบันทึก…',
  className = 'primary',
  disabled = false,
}: {
  children: ReactNode
  pendingLabel?: string
  className?: string
  disabled?: boolean
}) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      className={className}
      disabled={disabled || pending}
    >
      {pending ? pendingLabel : children}
    </button>
  )
}
