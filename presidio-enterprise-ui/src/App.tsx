import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import DataDiscovery from './pages/DataDiscovery'
import Analyzer from './pages/Analyzer'
import Anonymizer from './pages/Anonymizer'
import AnonymizationControls from './pages/AnonymizationControls'
import BatchProcessing from './pages/BatchProcessing'
import Instances from './pages/Instances'
import Monitoring from './pages/Monitoring'
import Compliance from './pages/Compliance'
import AuditLogs from './pages/AuditLogs'
import ComplianceReports from './pages/ComplianceReports'
import Clusters from './pages/Clusters'
import Configuration from './pages/Configuration'
import Users from './pages/Users'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/discovery" element={<DataDiscovery />} />
        <Route path="/analyzer" element={<Analyzer />} />
        <Route path="/anonymizer" element={<Anonymizer />} />
        <Route path="/anonymization-controls" element={<AnonymizationControls />} />
        <Route path="/batch" element={<BatchProcessing />} />
        <Route path="/instances" element={<Instances />} />
        <Route path="/monitoring" element={<Monitoring />} />
        <Route path="/compliance" element={<Compliance />} />
        <Route path="/audit-logs" element={<AuditLogs />} />
        <Route path="/compliance-reports" element={<ComplianceReports />} />
        <Route path="/clusters" element={<Clusters />} />
        <Route path="/configuration" element={<Configuration />} />
        <Route path="/users" element={<Users />} />
      </Routes>
    </Layout>
  )
}

export default App

// Made with Bob
