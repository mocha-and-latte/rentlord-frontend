import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './lib/auth'
import { AppShell } from './components/AppShell'
import { LoginPage } from './pages/AuthPage'
import { DashboardPage } from './pages/DashboardPage'
import { ResourceForm, ResourceList } from './pages/ResourcePages'
import {
  AgreementPage,
  AgreementsPage,
  NewAgreementPage,
  PublicAgreementPage,
} from './pages/AgreementPages'
import { InvoicePage, InvoicesPage, NewInvoicePage } from './pages/InvoicePages'
import { LineAccountsPage } from './pages/LineAccountsPage'
import { AdminPage, NotificationsPage } from './pages/MiscPages'
import { SettingsPage } from './pages/SettingsPage'
import {
  NewTenantInvitePage,
  PublicTenantInvitePage,
  TenantInviteCompletePage,
} from './pages/TenantInvitePages'

function Guard() {
  const { session, loading } = useAuth()
  if (loading) return <div className="splash">Rentlord</div>
  return session ? <AppShell /> : <Navigate to="/login" replace />
}
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage mode="login" />} />
      <Route path="/register" element={<LoginPage mode="register" />} />
      <Route
        path="/public/agreement/:token"
        element={<PublicAgreementPage />}
      />
      <Route path="/tenant-invite/:token" element={<PublicTenantInvitePage />} />
      <Route path="/tenant-invite/complete" element={<TenantInviteCompletePage />} />
      <Route element={<Guard />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/units" element={<ResourceList kind="units" />} />
        <Route path="/units/new" element={<ResourceForm kind="units" />} />
        <Route path="/units/:id" element={<ResourceForm kind="units" />} />
        <Route path="/tenants" element={<ResourceList kind="tenants" />} />
        <Route path="/tenants/new" element={<ResourceForm kind="tenants" />} />
        <Route path="/tenants/invite" element={<NewTenantInvitePage />} />
        <Route path="/tenants/:id" element={<ResourceForm kind="tenants" />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route
          path="/custom-fields"
          element={<ResourceList kind="custom-fields" />}
        />
        <Route
          path="/custom-fields/new"
          element={<ResourceForm kind="custom-fields" />}
        />
        <Route
          path="/custom-fields/:id"
          element={<ResourceForm kind="custom-fields" />}
        />
        <Route
          path="/agreement-templates"
          element={<ResourceList kind="agreement-templates" />}
        />
        <Route
          path="/agreement-templates/new"
          element={<ResourceForm kind="agreement-templates" />}
        />
        <Route
          path="/agreement-templates/:id"
          element={<ResourceForm kind="agreement-templates" />}
        />
        <Route path="/agreements" element={<AgreementsPage />} />
        <Route path="/agreements/new" element={<NewAgreementPage />} />
        <Route path="/agreements/:id" element={<AgreementPage />} />
        <Route path="/invoices" element={<InvoicesPage />} />
        <Route path="/invoices/new" element={<NewInvoicePage />} />
        <Route path="/invoices/:id" element={<InvoicePage />} />
        <Route path="/line-accounts" element={<LineAccountsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/admin/*" element={<AdminPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
