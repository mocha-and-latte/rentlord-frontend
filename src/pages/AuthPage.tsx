import { useActionState, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Building2, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { SubmitButton } from '../components/UI'
export function LoginPage({ mode }: { mode: 'login' | 'register' }) {
  const { session } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, submitAction, isPending] = useActionState(
    async (_previousError: string, formData: FormData) => {
      const email = String(formData.get('email') ?? '')
      const password = String(formData.get('password') ?? '')
      const name = String(formData.get('name') ?? '')
      const result =
        mode === 'login'
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({
              email,
              password,
              options: { data: { display_name: name } },
            })

      return result.error?.message ?? ''
    },
    '',
  )
  if (session) return <Navigate to="/dashboard" />
  return (
    <div className="auth-page">
      <section className="auth-story">
        <div className="brand light">
          <span>R</span>Rentlord
        </div>
        <div>
          <p className="eyebrow">RENTAL MANAGEMENT, SIMPLIFIED</p>
          <h1>
            ดูแลบ้านเช่า
            <br />
            อย่างสบายใจ
          </h1>
          <p>
            สัญญา ค่าเช่า และผู้เช่า อยู่ในที่เดียว
            <br />
            เรียบง่าย โปร่งใส พร้อมใช้งาน
          </p>
          <ul>
            <li>
              <Check />
              ติดตามค่าเช่าอัตโนมัติ
            </li>
            <li>
              <Check />
              สัญญาออนไลน์พร้อมแชร์
            </li>
            <li>
              <Check />
              เชื่อมต่อ LINE ได้ทันที
            </li>
          </ul>
        </div>
        <small>© 2026 Rentlord · Made for Thai landlords</small>
      </section>
      <section className="auth-form">
        <form action={submitAction}>
          <div className="mobile-brand">
            <Building2 /> Rentlord
          </div>
          <p className="eyebrow">
            {mode === 'login' ? 'ยินดีต้อนรับกลับ' : 'เริ่มต้นใช้งาน'}
          </p>
          <h2>{mode === 'login' ? 'เข้าสู่ระบบ' : 'สร้างบัญชีใหม่'}</h2>
          <p className="muted">
            {mode === 'login'
              ? 'จัดการบ้านเช่าของคุณต่อได้เลย'
              : 'สร้างพื้นที่จัดการบ้านเช่าภายในไม่กี่นาที'}
          </p>
          {!isPending && error && <div className="error-box">{error}</div>}
          {mode === 'register' && (
            <label>
              ชื่อที่แสดง
              <input
                name="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </label>
          )}
          <label>
            อีเมล
            <input
              type="email"
              name="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>
          <label>
            รหัสผ่าน
            <input
              type="password"
              name="password"
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          <SubmitButton
            className="primary wide"
            pendingLabel="กำลังดำเนินการ…"
          >
            {mode === 'login' ? 'เข้าสู่ระบบ' : 'สร้างบัญชี'}
          </SubmitButton>
          <div className="or">
            <span>หรือ</span>
          </div>
          <button
            type="button"
            className="line-button"
            disabled
            title="ตั้งค่า LINE Login ใน backend ก่อน"
          >
            LINE <b>เข้าสู่ระบบด้วย LINE</b>
          </button>
          <p className="switch">
            {mode === 'login' ? 'ยังไม่มีบัญชี?' : 'มีบัญชีแล้ว?'}{' '}
            <Link to={mode === 'login' ? '/register' : '/login'}>
              {mode === 'login' ? 'สมัครใช้งาน' : 'เข้าสู่ระบบ'}
            </Link>
          </p>
        </form>
      </section>
    </div>
  )
}
