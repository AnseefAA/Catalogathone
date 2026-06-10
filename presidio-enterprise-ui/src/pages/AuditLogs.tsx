import { useState, useEffect } from 'react'
import {
  FileText,
  Search,
  Download,
  Calendar,
  User,
  Shield,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Activity,
  Eye,
} from 'lucide-react'
import { auditApi } from '@/lib/api'
import type { AuditLog, AuditStats } from '@/types'

export default function AuditLogs() {
  const [activeTab, setActiveTab] = useState<'all' | 'pii-detection' | 'anonymization'>('all')
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [stats, setStats] = useState<AuditStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterOperation, setFilterOperation] = useState<string>('all')
  const [filterSuccess, setFilterSuccess] = useState<string>('all')
  const [dateRange] = useState({ start: '', end: '' })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    loadData()
  }, [activeTab, currentPage, filterOperation, filterSuccess])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Try to load from API, fall back to mock data
      try {
        const filters: Record<string, any> = {}
        if (filterOperation !== 'all') filters.operation = filterOperation
        if (filterSuccess !== 'all') filters.success = filterSuccess === 'true'
        if (dateRange.start) filters.start_date = dateRange.start
        if (dateRange.end) filters.end_date = dateRange.end

        const [logsData, statsData] = await Promise.all([
          auditApi.getAuditLogs(currentPage, 50, filters),
          auditApi.getAuditStats(),
        ])
        
        setAuditLogs(logsData.items)
        setTotalPages(logsData.total_pages)
        setStats(statsData)
      } catch (apiError) {
        console.warn('API not available, using mock data')
        setAuditLogs(getMockAuditLogs())
        setStats(getMockStats())
        setTotalPages(1)
      }
    } catch (error) {
      console.error('Failed to load audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getMockAuditLogs = (): AuditLog[] => {
    const now = new Date()
    return [
      {
        id: 'log-1',
        timestamp: new Date(now.getTime() - 5 * 60000).toISOString(),
        instance_id: 'inst-1',
        application_id: 'app-1',
        application_name: 'Customer Portal',
        operation: 'analyze',
        user: 'john.doe@company.com',
        user_role: 'operator',
        entity_types: ['EMAIL_ADDRESS', 'PHONE_NUMBER', 'CREDIT_CARD'],
        entities_count: 15,
        pii_detected: 15,
        pii_anonymized: 0,
        success: true,
        duration_ms: 245,
        source_ip: '192.168.1.100',
        metadata: { file_name: 'customer_data.csv', file_size: 2048576 },
      },
      {
        id: 'log-2',
        timestamp: new Date(now.getTime() - 15 * 60000).toISOString(),
        instance_id: 'inst-1',
        application_id: 'app-2',
        application_name: 'Analytics Service',
        operation: 'anonymize',
        user: 'jane.smith@company.com',
        user_role: 'admin',
        entity_types: ['EMAIL_ADDRESS', 'US_SSN'],
        entities_count: 8,
        pii_detected: 8,
        pii_anonymized: 8,
        success: true,
        duration_ms: 189,
        source_ip: '192.168.1.101',
        metadata: { policy_id: 'policy-2', policy_name: 'Analytics Data Policy' },
      },
      {
        id: 'log-3',
        timestamp: new Date(now.getTime() - 30 * 60000).toISOString(),
        instance_id: 'inst-1',
        application_id: 'app-1',
        application_name: 'Customer Portal',
        operation: 'process',
        user: 'bob.wilson@company.com',
        user_role: 'operator',
        entity_types: ['PHONE_NUMBER', 'CREDIT_CARD'],
        entities_count: 23,
        pii_detected: 23,
        pii_anonymized: 23,
        success: true,
        duration_ms: 412,
        source_ip: '192.168.1.102',
        metadata: { batch_id: 'batch-001', records_processed: 150 },
      },
      {
        id: 'log-4',
        timestamp: new Date(now.getTime() - 45 * 60000).toISOString(),
        instance_id: 'inst-1',
        application_id: 'app-3',
        application_name: 'Admin Dashboard',
        operation: 'analyze',
        user: 'admin@company.com',
        user_role: 'admin',
        entity_types: ['EMAIL_ADDRESS'],
        entities_count: 5,
        pii_detected: 5,
        pii_anonymized: 0,
        success: false,
        duration_ms: 1250,
        source_ip: '192.168.1.103',
        metadata: { error: 'Timeout exceeded', retry_count: 2 },
      },
      {
        id: 'log-5',
        timestamp: new Date(now.getTime() - 60 * 60000).toISOString(),
        instance_id: 'inst-1',
        application_id: 'app-2',
        application_name: 'Analytics Service',
        operation: 'policy_change',
        user: 'admin@company.com',
        user_role: 'admin',
        entity_types: [],
        entities_count: 0,
        pii_detected: 0,
        pii_anonymized: 0,
        success: true,
        duration_ms: 45,
        source_ip: '192.168.1.103',
        metadata: { action: 'policy_enabled', policy_id: 'policy-2' },
      },
    ]
  }

  const getMockStats = (): AuditStats => ({
    total_logs: 15847,
    today_logs: 342,
    pii_detected_today: 1256,
    pii_anonymized_today: 1189,
    anonymization_rate: 94.7,
    top_users: [
      { user: 'john.doe@company.com', operations_count: 145, pii_detected: 523, last_activity: new Date().toISOString() },
      { user: 'jane.smith@company.com', operations_count: 98, pii_detected: 412, last_activity: new Date().toISOString() },
      { user: 'bob.wilson@company.com', operations_count: 67, pii_detected: 321, last_activity: new Date().toISOString() },
    ],
    top_applications: [
      { application_id: 'app-1', application_name: 'Customer Portal', operations_count: 234, pii_detected: 856, pii_anonymized: 823, risk_level: 'medium' },
      { application_id: 'app-2', application_name: 'Analytics Service', operations_count: 156, pii_detected: 400, pii_anonymized: 398, risk_level: 'low' },
      { application_id: 'app-3', application_name: 'Admin Dashboard', operations_count: 45, pii_detected: 0, pii_anonymized: 0, risk_level: 'low' },
    ],
    recent_violations: [],
  })

  const filteredLogs = auditLogs.filter(log =>
    log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.application_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.operation.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const exportLogs = async (format: 'csv' | 'json') => {
    try {
      const blob = await auditApi.exportAuditLogs({}, format)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export feature requires backend API')
    }
  }

  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case 'analyze': return <Search className="w-4 h-4" />
      case 'anonymize': return <Shield className="w-4 h-4" />
      case 'process': return <Activity className="w-4 h-4" />
      case 'policy_change': return <FileText className="w-4 h-4" />
      default: return <Eye className="w-4 h-4" />
    }
  }

  const getOperationColor = (operation: string) => {
    switch (operation) {
      case 'analyze': return 'bg-blue-100 text-blue-800'
      case 'anonymize': return 'bg-green-100 text-green-800'
      case 'process': return 'bg-purple-100 text-purple-800'
      case 'policy_change': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track PII detection, anonymization actions, and system activities
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => exportLogs('csv')}
            className="btn-secondary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => exportLogs('json')}
            className="btn-secondary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export JSON
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Logs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_logs.toLocaleString()}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today's Logs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.today_logs}</p>
              </div>
              <Clock className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">PII Detected</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pii_detected_today}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-600" />
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">PII Anonymized</p>
                <p className="text-2xl font-bold text-green-600">{stats.pii_anonymized_today}</p>
              </div>
              <Shield className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Anonymization Rate</p>
                <p className="text-2xl font-bold text-green-600">{stats.anonymization_rate}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="card">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'all'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All Activities
            </button>
            <button
              onClick={() => setActiveTab('pii-detection')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'pii-detection'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              PII Detection
            </button>
            <button
              onClick={() => setActiveTab('anonymization')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'anonymization'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Anonymization Actions
            </button>
          </nav>
        </div>

        {/* Filters */}
        <div className="p-4 border-b bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
            <select
              value={filterOperation}
              onChange={(e) => setFilterOperation(e.target.value)}
              className="input"
            >
              <option value="all">All Operations</option>
              <option value="analyze">Analyze</option>
              <option value="anonymize">Anonymize</option>
              <option value="process">Process</option>
              <option value="policy_change">Policy Change</option>
            </select>
            <select
              value={filterSuccess}
              onChange={(e) => setFilterSuccess(e.target.value)}
              className="input"
            >
              <option value="all">All Status</option>
              <option value="true">Success</option>
              <option value="false">Failed</option>
            </select>
            <button className="btn-secondary flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Date Range
            </button>
          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Operation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Application
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PII Detected
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PII Anonymized
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatTimestamp(log.timestamp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getOperationColor(log.operation)}`}>
                      {getOperationIcon(log.operation)}
                      {log.operation}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{log.user}</div>
                        {log.user_role && (
                          <div className="text-xs text-gray-500">{log.user_role}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.application_name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="font-medium text-orange-600">{log.pii_detected}</span>
                    {log.entity_types.length > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        {log.entity_types.slice(0, 2).join(', ')}
                        {log.entity_types.length > 2 && ` +${log.entity_types.length - 2}`}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    {log.pii_anonymized}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {log.success ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3" />
                        Success
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <XCircle className="w-3 h-3" />
                        Failed
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.duration_ms ? `${log.duration_ms}ms` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="btn-secondary disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="btn-secondary disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Top Users & Applications */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Users */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Users</h3>
            <div className="space-y-3">
              {stats.top_users.map((user, index) => (
                <div key={user.user} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{user.user}</div>
                      <div className="text-sm text-gray-500">{user.operations_count} operations</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-orange-600">{user.pii_detected}</div>
                    <div className="text-xs text-gray-500">PII detected</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Applications */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Applications</h3>
            <div className="space-y-3">
              {stats.top_applications.map((app, index) => (
                <div key={app.application_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{app.application_name}</div>
                      <div className="text-sm text-gray-500">{app.operations_count} operations</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-orange-600">{app.pii_detected}</div>
                    <div className="text-xs text-gray-500">
                      {app.pii_anonymized} anonymized
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Made with Bob