// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import { Spinner } from './components'

// Auth
import Login from './pages/Auth/Login'

// Dashboard
import Dashboard from './pages/Dashboard/Dashboard'

// FIR
import FIRList from './pages/FIR/FIRList'
import FIRForm from './pages/FIR/FIRForm'

// Cases
import CaseList   from './pages/Cases/CaseList'
import CaseDetail from './pages/Cases/CaseDetail'

// Officers
import { OfficerList, OfficerWorkload } from './pages/Officers/Officers'
import OfficerDetail from './pages/Officers/OfficerDetail'

// Suspects
import SuspectList from './pages/Suspects/SuspectList'

// Evidence
import EvidenceList from './pages/Evidence/EvidenceList'

// Charges
import ChargeList from './pages/Charges/ChargeList'

// Reports
import Reports from './pages/Reports/Reports'

function AppRoutes() {
  const { loading } = useAuth()
  if (loading) return <Spinner />

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />

      {/* Dashboard */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout><Dashboard /></Layout>
        </ProtectedRoute>
      } />

      {/* FIR */}
      <Route path="/fir" element={
        <ProtectedRoute>
          <Layout><FIRList /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/fir/new" element={
        <ProtectedRoute roles={['admin','officer']}>
          <Layout><FIRForm /></Layout>
        </ProtectedRoute>
      } />

      {/* Cases */}
      <Route path="/cases" element={
        <ProtectedRoute>
          <Layout><CaseList /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/cases/:id" element={
        <ProtectedRoute>
          <Layout><CaseDetail /></Layout>
        </ProtectedRoute>
      } />

      {/* Officers */}
      <Route path="/officers" element={
  <ProtectedRoute>
    <Layout><OfficerList /></Layout>
  </ProtectedRoute>
} />
<Route path="/officers/:id" element={
  <ProtectedRoute>
    <Layout><OfficerDetail /></Layout>
  </ProtectedRoute>
} />
<Route path="/officers/workload" element={
  <ProtectedRoute>
    <Layout><OfficerWorkload /></Layout>
  </ProtectedRoute>
} />

      {/* Suspects */}
      <Route path="/suspects" element={
        <ProtectedRoute>
          <Layout><SuspectList /></Layout>
        </ProtectedRoute>
      } />

      {/* Evidence */}
      <Route path="/evidence" element={
        <ProtectedRoute>
          <Layout><EvidenceList /></Layout>
        </ProtectedRoute>
      } />

      {/* Charges */}
      <Route path="/charges" element={
        <ProtectedRoute>
          <Layout><ChargeList /></Layout>
        </ProtectedRoute>
      } />

      {/* Reports */}
      <Route path="/reports" element={
        <ProtectedRoute roles={['admin','officer']}>
          <Layout><Reports /></Layout>
        </ProtectedRoute>
      } />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
