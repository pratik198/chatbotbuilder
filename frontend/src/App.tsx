import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Layout from './components/layout/Layout'
import PlatformChat from './components/PlatformChat'

// Pages
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import BotsPage from './pages/BotsPage'
import BotDetailPage from './pages/BotDetailPage'
import KnowledgeBasePage from './pages/KnowledgeBasePage'
import ConversationsPage from './pages/ConversationsPage'
import AnalyticsPage from './pages/AnalyticsPage'
import ContactsPage from './pages/ContactsPage'
import LiveChatPage from './pages/LiveChatPage'
import SettingsPage from './pages/SettingsPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.accessToken)
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"      element={<DashboardPage />} />
          <Route path="bots"           element={<BotsPage />} />
          <Route path="bots/:id"       element={<BotDetailPage />} />
          <Route path="knowledge-base" element={<KnowledgeBasePage />} />
          <Route path="conversations"  element={<ConversationsPage />} />
          <Route path="contacts"       element={<ContactsPage />} />
          <Route path="live-chat"      element={<LiveChatPage />} />
          <Route path="analytics"      element={<AnalyticsPage />} />
          <Route path="settings"       element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <PlatformChat />
    </>
  )
}
