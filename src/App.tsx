import { Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import MainLayout from './components/Layout/MainLayout'
import ProtectedRoute from './components/ProtectedRoute'
import RouteBoundary from './components/RouteBoundary'
import { useAuth } from './contexts/AuthContext'

const Home = lazy(() => import('./pages/Home'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Payment = lazy(() => import('./pages/Payment'))
const Test = lazy(() => import('./pages/Test'))
const UserAgreement = lazy(() => import('./pages/UserAgreement'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))

const Dashboard = lazy(() => import('./pages/Dashboard'))
const LinksGenerate = lazy(() => import('./pages/LinksGenerate'))
const LinksManage = lazy(() => import('./pages/LinksManage'))
const BatchImportLinks = lazy(() => import('./pages/BatchImportLinks'))
const Packages = lazy(() => import('./pages/Packages'))
const Notifications = lazy(() => import('./pages/Notifications'))
const Profile = lazy(() => import('./pages/Profile'))
const Settings = lazy(() => import('./pages/Settings'))
const Feedback = lazy(() => import('./pages/Feedback'))
const Invite = lazy(() => import('./pages/Invite'))
const ReportDetail = lazy(() => import('./pages/ReportDetail'))
const Reports = lazy(() => import('./pages/Reports'))
const ExportHistory = lazy(() => import('./pages/ExportHistory'))
const Statistics = lazy(() => import('./pages/Statistics'))
const Manager = lazy(() => import('./pages/Manager'))
const UserManagement = lazy(() => import('./pages/UserManagement'))
const UserDetail = lazy(() => import('./pages/UserDetail'))
const QuestionImport = lazy(() => import('./pages/QuestionImport'))
const QuestionManagePage = lazy(() => import('./pages/QuestionManagePage'))
const QuestionnaireManage = lazy(() => import('./pages/QuestionnaireManage'))
const AuditLogs = lazy(() => import('./pages/AuditLogs'))
const BackupManage = lazy(() => import('./pages/BackupManage'))

// 页面加载组件
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">加载中...</p>
      </div>
    </div>
  )
}

export default function App() {
  const { isAuthenticated } = useAuth()

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* 首页 */}
        <Route 
          path="/" 
          element={<Home />} 
        />
        <Route 
          path="/login" 
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : (
              <Login />
            )
          } 
        />
        <Route 
          path="/register" 
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : (
              <Register />
            )
          } 
        />
        <Route 
          path="/payment" 
          element={<Payment />} 
        />
        <Route 
          path="/test/:linkId" 
          element={<Test />} 
        />
        <Route 
          path="/user-agreement" 
          element={<UserAgreement />} 
        />
        <Route 
          path="/privacy-policy" 
          element={<PrivacyPolicy />} 
        />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route 
            path="dashboard" 
            element={<Dashboard />} 
          />
          <Route 
            path="links/generate" 
            element={<LinksGenerate />} 
          />
          <Route 
            path="links/manage" 
            element={<LinksManage />} 
          />
          <Route 
            path="links/batch-import" 
            element={
              <RouteBoundary title="批量导入链接">
                <BatchImportLinks />
              </RouteBoundary>
            } 
          />
          <Route 
            path="packages" 
            element={<Packages />} 
          />
          <Route 
            path="notifications" 
            element={<Notifications />} 
          />
          <Route 
            path="profile" 
            element={<Profile />} 
          />
          <Route 
            path="settings" 
            element={<Settings />} 
          />
          <Route 
            path="feedback" 
            element={<Feedback />} 
          />
          <Route 
            path="invite" 
            element={<Invite />} 
          />
          <Route 
            path="reports/:id" 
            element={<ReportDetail />} 
          />
          <Route 
            path="admin/reports" 
            element={<Reports />} 
          />
          <Route 
            path="admin/export-history" 
            element={<ExportHistory />} 
          />
          <Route 
            path="statistics" 
            element={<Statistics />} 
          />
          <Route 
            path="manager" 
            element={<Manager />} 
          />
          <Route 
            path="admin/users" 
            element={<UserManagement />} 
          />
          <Route 
            path="admin/users/:userId" 
            element={<UserDetail />} 
          />
          <Route 
            path="admin/questions/import" 
            element={
              <RouteBoundary title="题库导入">
                <QuestionImport />
              </RouteBoundary>
            } 
          />
          <Route 
            path="admin/questions/manage" 
            element={<QuestionManagePage />} 
          />
          <Route 
            path="admin/questionnaires/manage" 
            element={<QuestionnaireManage />} 
          />
          <Route 
            path="admin/audit" 
            element={<AuditLogs />} 
          />
          <Route 
            path="admin/backup" 
            element={
              <RouteBoundary title="备份管理">
                <BackupManage />
              </RouteBoundary>
            } 
          />
        </Route>
      </Routes>
    </Suspense>
  )
}
