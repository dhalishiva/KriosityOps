import { Route, Routes } from 'react-router-dom';
import '../styles/app.css';
import { AuthProvider } from '../lib/auth';
import { AppShell, RequireAuth } from './AppShell';
import AuthPage from './AuthPage';
import AppsPage from './AppsPage';
import AppDetail from './AppDetail';
import BillingPage from './BillingPage';
import SettingsPage from './SettingsPage';
import AdminPage from './AdminPage';
import { NotFoundPage } from '../marketing/Pages';

const shell = (el: JSX.Element, admin = false) => (
  <RequireAuth admin={admin}>
    <AppShell>{el}</AppShell>
  </RequireAuth>
);

export default function AppArea() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/signup" element={<AuthPage mode="signup" />} />
        <Route path="/app" element={shell(<AppsPage />)} />
        <Route path="/app/billing" element={shell(<BillingPage />)} />
        <Route path="/app/settings" element={shell(<SettingsPage />)} />
        <Route path="/app/:id" element={shell(<AppDetail />)} />
        <Route path="/admin" element={shell(<AdminPage />, true)} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  );
}
