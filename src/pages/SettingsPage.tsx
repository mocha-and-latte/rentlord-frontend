import { ArrowRight, FileText, SlidersHorizontal } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/UI'

const settings = [
  {
    to: '/agreement-templates',
    icon: FileText,
    title: 'แม่แบบสัญญา',
    description: 'สร้างและแก้ไขข้อความสัญญา พร้อมตัวแปรอัตโนมัติ',
  },
  {
    to: '/custom-fields',
    icon: SlidersHorizontal,
    title: 'ฟิลด์กำหนดเอง',
    description: 'เพิ่มข้อมูลเฉพาะสำหรับยูนิต ผู้เช่า และสัญญา',
  },
] as const

export function SettingsPage() {
  return (
    <>
      <PageHeader
        title="ตั้งค่า"
        subtitle="ปรับแต่งข้อมูลและเอกสารให้เหมาะกับการจัดการบ้านเช่าของคุณ"
      />
      <div className="settings-grid">
        {settings.map(({ to, icon: Icon, title, description }) => (
          <Link className="settings-card" to={to} key={to}>
            <span className="settings-icon">
              <Icon size={22} />
            </span>
            <span className="settings-copy">
              <strong>{title}</strong>
              <small>{description}</small>
            </span>
            <ArrowRight size={18} />
          </Link>
        ))}
      </div>
    </>
  )
}
