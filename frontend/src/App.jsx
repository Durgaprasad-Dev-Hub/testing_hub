import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { ToastProvider } from './context/ToastContext'
import AppLayout from './components/layout/AppLayout'
import LoadingScreen from './components/common/LoadingScreen'

import ErrorBoundary from './components/common/ErrorBoundary'

// Lazy-load pages for code splitting
const LandingPage   = lazy(() => import('./pages/LandingPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const ProjectsPage  = lazy(() => import('./pages/ProjectsPage'))
const ProjectDetail = lazy(() => import('./pages/ProjectDetailPage'))
const NewAnalysis   = lazy(() => import('./pages/NewAnalysisPage'))
const FindingsPage  = lazy(() => import('./pages/FindingsPage'))
const FindingDetail = lazy(() => import('./pages/FindingDetailPage'))
const ScanConsole   = lazy(() => import('./pages/ScanConsolePage'))
const PatchesPage   = lazy(() => import('./pages/PatchesPage'))
const ReportsPage   = lazy(() => import('./pages/ReportsPage'))
const SettingsPage  = lazy(() => import('./pages/SettingsPage'))
const NotFoundPage  = lazy(() => import('./pages/NotFoundPage'))

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppProvider>
          <ToastProvider>
            <Suspense fallback={<LoadingScreen />}>
          <Routes>
            {/* Landing */}
            <Route path="/" element={<LandingPage />} />

            {/* App (with sidebar layout) */}
            <Route element={<AppLayout />}>
              <Route path="/dashboard"           element={<DashboardPage />} />
              <Route path="/projects"            element={<ProjectsPage />} />
              <Route path="/projects/:id"        element={<ProjectDetail />} />
              <Route path="/projects/:id/scan"   element={<ScanConsole />} />
              <Route path="/new-analysis"        element={<NewAnalysis />} />
              <Route path="/findings"            element={<FindingsPage />} />
              <Route path="/findings/:id"        element={<FindingDetail />} />
              <Route path="/patches"             element={<PatchesPage />} />
              <Route path="/reports"             element={<ReportsPage />} />
              <Route path="/settings"            element={<SettingsPage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </ToastProvider>
    </AppProvider>
  </BrowserRouter>
</ErrorBoundary>
)
}
