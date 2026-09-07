import { useQuery } from '@tanstack/react-query'
import {
  ArrowRight,
  Building2,
  CalendarClock,
  CircleDollarSign,
  Plus,
  TriangleAlert,
  UserPlus,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { money } from '../lib/locale'
import { ErrorBox, Loading, PageHeader } from '../components/UI'

export function DashboardPage() {
  const { session } = useAuth()
  const accountId = session?.user.id ?? 'anonymous'
  const dashboard = useQuery({
    queryKey: ['dashboard', accountId],
    queryFn: ({ signal }) => api<any>('/dashboard', { signal }),
  })
  const profile = useQuery({
    queryKey: ['me', accountId],
    queryFn: ({ signal }) => api<any>('/me', { signal }),
  })
  const data = dashboard.data
  const me = profile.data
  const error = dashboard.error || profile.error
  if (error) return <ErrorBox error={error} />
  if (dashboard.isPending || profile.isPending) return <Loading />
  return (
    <>
      <PageHeader
        title={`สวัสดี, ${me?.displayName || 'คุณเจ้าของบ้าน'} 👋`}
        subtitle="นี่คือภาพรวมบ้านเช่าของคุณวันนี้"
        action={
          <Link className="primary" to="/invoices/new">
            <Plus size={18} />
            สร้างใบแจ้งหนี้
          </Link>
        }
      />
      <div className="metric-grid">
        <div className="metric green">
          <CircleDollarSign />
          <span>รับชำระเดือนนี้</span>
          <strong>{money(data.paidThisMonth)}</strong>
          <small>อัปเดตแบบเรียลไทม์</small>
        </div>
        <div className="metric">
          <CalendarClock />
          <span>ใกล้ครบกำหนด</span>
          <strong>{data.upcomingDue}</strong>
          <small>รายการรอชำระ</small>
        </div>
        <div className="metric warn">
          <TriangleAlert />
          <span>เกินกำหนด</span>
          <strong>{data.overdue}</strong>
          <small>ควรติดตาม</small>
        </div>
        <div className="metric">
          <Building2 />
          <span>ยูนิตทั้งหมด</span>
          <strong>{data.unitCount}</strong>
          <small>ในระบบ</small>
        </div>
      </div>
      <div className="dashboard-grid">
        <section className="detail-card">
          <div className="section-heading">
            <h3>กิจกรรมล่าสุด</h3>
          </div>
          {!data.activity.length ? (
            <p className="muted">กิจกรรมใหม่จะปรากฏที่นี่</p>
          ) : (
            data.activity.map((x: any) => (
              <div className="activity">
                <span className="activity-icon">✓</span>
                <div>
                  <strong>{x.action.replaceAll('_', ' ')}</strong>
                  <small>{x.entityType}</small>
                </div>
              </div>
            ))
          )}
        </section>
        <section className="detail-card">
          <h3>ทางลัด</h3>
          <Link className="quick" to="/units/new">
            <Building2 />
            <span>
              <strong>เพิ่มยูนิตใหม่</strong>
              <small>บ้าน ห้อง หรือพื้นที่เช่า</small>
            </span>
            <ArrowRight />
          </Link>
          <Link className="quick" to="/tenants/new">
            <UserPlus />
            <span>
              <strong>เพิ่มผู้เช่า</strong>
              <small>บันทึกข้อมูลผู้เช่าใหม่</small>
            </span>
            <ArrowRight />
          </Link>
          <Link className="quick" to="/agreements/new">
            <Plus />
            <span>
              <strong>สร้างสัญญา</strong>
              <small>เริ่มจากแม่แบบที่มี</small>
            </span>
            <ArrowRight />
          </Link>
        </section>
      </div>
    </>
  )
}
