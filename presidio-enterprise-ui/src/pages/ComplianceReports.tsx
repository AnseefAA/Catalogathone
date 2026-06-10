import { useState, useEffect } from 'react'
import {
  FileText,
  Download,
  TrendingUp,
  AlertTriangle,
  XCircle,
  PieChart,
  Shield,
  Activity,
  Building,
} from 'lucide-react'
import { auditApi } from '@/lib/api'
import type { ComplianceReport, RiskyApplication, TrendData, EntityTypeStats } from '@/types'

export default function ComplianceReports() {
  const [reports, setReports] = useState<ComplianceReport[]>([])
  const [selectedReport, setSelectedReport] = useState<ComplianceReport | null>(null)
  const [reportType, setReportType] = useState<'gdpr' | 'hipaa' | 'ccpa' | 'general'>('general')
  const [loading, setLoading] = useState(true)
  const [riskyApps, setRiskyApps] = useState<RiskyApplication[]>([])
  const [piiTrend, setPiiTrend] = useState<TrendData[]>([])
  const [entityBreakdown, setEntityBreakdown] = useState<EntityTypeStats[]>([])

  useEffect(() => {
    loadData()
  }, [reportType])

  const loadData = async () => {
    try {
      setLoading(true)
      
      try {
        const [reportsData, riskyAppsData, trendData, breakdownData] = await Promise.all([
          auditApi.getComplianceReports(reportType),
          auditApi.getRiskyApplications(),
          auditApi.getPIIExposureTrend(30),
          auditApi.getEntityTypeBreakdown(),
        ])
        
        setReports(reportsData)
        setRiskyApps(riskyAppsData)
        setPiiTrend(trendData)
        setEntityBreakdown(breakdownData)
        
        if (reportsData.length > 0) {
          setSelectedReport(reportsData[0])
        }
      } catch (apiError) {
        console.warn('API not available, using mock data')
        const mockReports = getMockReports()
        setReports(mockReports)
        setSelectedReport(mockReports[0])
        setRiskyApps(getMockRiskyApps())
        setPiiTrend(getMockTrend())
        setEntityBreakdown(getMockEntityBreakdown())
      }
    } catch (error) {
      console.error('Failed to load compliance reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const getMockReports = (): ComplianceReport[] => {
    const now = new Date()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
    
    return [
      {
        id: 'report-1',
        period_start: lastMonth.toISOString(),
        period_end: lastMonthEnd.toISOString(),
        report_type: 'gdpr',
        total_operations: 15847,
        pii_detected: 12456,
        pii_anonymized: 11823,
        compliance_score: 94.9,
        violations: [
          {
            id: 'viol-1',
            timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            type: 'Unprotected PII in logs',
            severity: 'high',
            description: 'Email addresses found in application logs without anonymization',
            instance_id: 'inst-1',
            application_id: 'app-1',
            application_name: 'Customer Portal',
            regulation: 'gdpr',
            remediation_status: 'in_progress',
            assigned_to: 'security-team@company.com',
          },
          {
            id: 'viol-2',
            timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            type: 'Data retention policy violation',
            severity: 'medium',
            description: 'PII data retained beyond 90-day policy',
            instance_id: 'inst-1',
            application_id: 'app-2',
            application_name: 'Analytics Service',
            regulation: 'gdpr',
            remediation_status: 'resolved',
            assigned_to: 'data-team@company.com',
          },
        ],
        top_risky_applications: getMockRiskyApps(),
        pii_exposure_trend: getMockTrend(),
        entity_type_breakdown: getMockEntityBreakdown(),
      },
      {
        id: 'report-2',
        period_start: new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString(),
        period_end: new Date(now.getFullYear(), now.getMonth() - 1, 0).toISOString(),
        report_type: 'gdpr',
        total_operations: 14523,
        pii_detected: 11234,
        pii_anonymized: 10456,
        compliance_score: 93.1,
        violations: [],
        top_risky_applications: [],
        pii_exposure_trend: [],
        entity_type_breakdown: [],
      },
    ]
  }

  const getMockRiskyApps = (): RiskyApplication[] => [
    {
      application_id: 'app-1',
      application_name: 'Customer Portal',
      risk_score: 78,
      pii_exposure_count: 856,
      unprotected_pii_count: 33,
      violations_count: 2,
      last_incident: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      application_id: 'app-3',
      application_name: 'Admin Dashboard',
      risk_score: 65,
      pii_exposure_count: 234,
      unprotected_pii_count: 12,
      violations_count: 1,
      last_incident: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      application_id: 'app-2',
      application_name: 'Analytics Service',
      risk_score: 42,
      pii_exposure_count: 400,
      unprotected_pii_count: 2,
      violations_count: 1,
      last_incident: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ]

  const getMockTrend = (): TrendData[] => {
    const data: TrendData[] = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      data.push({
        timestamp: date.toISOString(),
        value: Math.floor(Math.random() * 100) + 300,
        label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      })
    }
    return data
  }

  const getMockEntityBreakdown = (): EntityTypeStats[] => [
    { entity_type: 'EMAIL_ADDRESS', count: 4523, percentage: 36.3, anonymized_count: 4401, anonymization_rate: 97.3 },
    { entity_type: 'PHONE_NUMBER', count: 3234, percentage: 26.0, anonymized_count: 3156, anonymization_rate: 97.6 },
    { entity_type: 'CREDIT_CARD', count: 2156, percentage: 17.3, anonymized_count: 2089, anonymization_rate: 96.9 },
    { entity_type: 'US_SSN', count: 1456, percentage: 11.7, anonymized_count: 1423, anonymization_rate: 97.7 },
    { entity_type: 'PERSON', count: 1087, percentage: 8.7, anonymized_count: 1054, anonymization_rate: 97.0 },
  ]

  const generateReport = async () => {
    try {
      const now = new Date()
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const endDate = now.toISOString()
      
      const report = await auditApi.generateComplianceReport(reportType, startDate, endDate)
      setReports([report, ...reports])
      setSelectedReport(report)
    } catch (error) {
      console.error('Failed to generate report:', error)
      alert('Report generation requires backend API')
    }
  }

  const exportReport = async (format: 'pdf' | 'csv' | 'json') => {
    if (!selectedReport) return
    
    try {
      const blob = await auditApi.exportComplianceReport(selectedReport.id, format)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `compliance-report-${selectedReport.id}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export feature requires backend API')
    }
  }

  const getComplianceScoreColor = (score: number) => {
    if (score >= 95) return 'text-green-600'
    if (score >= 85) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getRiskLevelColor = (score: number) => {
    if (score >= 70) return 'bg-red-100 text-red-800'
    if (score >= 50) return 'bg-orange-100 text-orange-800'
    if (score >= 30) return 'bg-yellow-100 text-yellow-800'
    return 'bg-green-100 text-green-800'
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'open': return 'bg-red-100 text-red-800'
      case 'accepted_risk': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Compliance Reports</h1>
          <p className="mt-1 text-sm text-gray-500">
            GDPR, HIPAA, and CCPA compliance monitoring and reporting
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={generateReport}
            className="btn-primary flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Generate Report
          </button>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="card p-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Regulation:</span>
          <div className="flex gap-2">
            {(['general', 'gdpr', 'hipaa', 'ccpa'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setReportType(type)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  reportType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Report Overview */}
      {selectedReport && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Compliance Score</h3>
                <Shield className="w-5 h-5 text-gray-400" />
              </div>
              <div className={`text-3xl font-bold ${getComplianceScoreColor(selectedReport.compliance_score)}`}>
                {selectedReport.compliance_score}%
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      selectedReport.compliance_score >= 95 ? 'bg-green-600' :
                      selectedReport.compliance_score >= 85 ? 'bg-yellow-600' : 'bg-red-600'
                    }`}
                    style={{ width: `${selectedReport.compliance_score}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Total Operations</h3>
                <Activity className="w-5 h-5 text-gray-400" />
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {selectedReport.total_operations.toLocaleString()}
              </div>
              <div className="mt-2 text-sm text-gray-500">
                {new Date(selectedReport.period_start).toLocaleDateString()} - {new Date(selectedReport.period_end).toLocaleDateString()}
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">PII Detected</h3>
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <div className="text-3xl font-bold text-orange-600">
                {selectedReport.pii_detected.toLocaleString()}
              </div>
              <div className="mt-2 text-sm text-gray-500">
                {selectedReport.pii_anonymized.toLocaleString()} anonymized
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">Violations</h3>
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div className="text-3xl font-bold text-red-600">
                {selectedReport.violations.length}
              </div>
              <div className="mt-2 text-sm text-gray-500">
                {selectedReport.violations.filter(v => v.remediation_status === 'open').length} open
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* PII Exposure Trend */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">PII Exposure Over Time</h3>
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div className="h-64 flex items-end justify-between gap-1">
                {piiTrend.slice(-14).map((point, index) => {
                  const maxValue = Math.max(...piiTrend.map(p => p.value))
                  const height = (point.value / maxValue) * 100
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors cursor-pointer"
                        style={{ height: `${height}%` }}
                        title={`${point.value} PII detected`}
                      />
                      <div className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-top-left">
                        {new Date(point.timestamp).getDate()}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="mt-4 text-sm text-gray-600 text-center">
                Last 14 days
              </div>
            </div>

            {/* Entity Type Breakdown */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Entity Type Breakdown</h3>
                <PieChart className="w-5 h-5 text-purple-600" />
              </div>
              <div className="space-y-3">
                {entityBreakdown.map((entity) => (
                  <div key={entity.entity_type}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{entity.entity_type}</span>
                      <span className="text-sm text-gray-600">{entity.count.toLocaleString()} ({entity.percentage}%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{ width: `${entity.percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-green-600 font-medium">
                        {entity.anonymization_rate}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Risky Applications */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Top Risky Applications</h3>
              <Building className="w-5 h-5 text-red-600" />
            </div>
            <div className="space-y-3">
              {riskyApps.map((app, index) => (
                <div key={app.application_id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900">{app.application_name}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRiskLevelColor(app.risk_score)}`}>
                        Risk: {app.risk_score}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{app.pii_exposure_count} PII exposures</span>
                      <span>•</span>
                      <span className="text-red-600 font-medium">{app.unprotected_pii_count} unprotected</span>
                      <span>•</span>
                      <span>{app.violations_count} violations</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Last incident</div>
                    <div className="text-sm font-medium text-gray-900">
                      {new Date(app.last_incident).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Violations */}
          {selectedReport.violations.length > 0 && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Compliance Violations</h3>
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div className="space-y-3">
                {selectedReport.violations.map((violation) => (
                  <div key={violation.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900">{violation.type}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(violation.severity)}`}>
                            {violation.severity}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(violation.remediation_status)}`}>
                            {violation.remediation_status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{violation.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{violation.application_name}</span>
                          <span>•</span>
                          <span>{new Date(violation.timestamp).toLocaleString()}</span>
                          {violation.assigned_to && (
                            <>
                              <span>•</span>
                              <span>Assigned to: {violation.assigned_to}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Export Options */}
          <div className="card p-6 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Report</h3>
            <div className="flex gap-3">
              <button
                onClick={() => exportReport('pdf')}
                className="btn-primary flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export as PDF
              </button>
              <button
                onClick={() => exportReport('csv')}
                className="btn-secondary flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export as CSV
              </button>
              <button
                onClick={() => exportReport('json')}
                className="btn-secondary flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export as JSON
              </button>
            </div>
          </div>
        </>
      )}

      {/* Historical Reports */}
      {reports.length > 1 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Historical Reports</h3>
          <div className="space-y-2">
            {reports.slice(1).map((report) => (
              <button
                key={report.id}
                onClick={() => setSelectedReport(report)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
              >
                <div>
                  <div className="font-medium text-gray-900">
                    {report.report_type.toUpperCase()} Report
                  </div>
                  <div className="text-sm text-gray-600">
                    {new Date(report.period_start).toLocaleDateString()} - {new Date(report.period_end).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className={`text-2xl font-bold ${getComplianceScoreColor(report.compliance_score)}`}>
                    {report.compliance_score}%
                  </div>
                  <div className="text-sm text-gray-600">
                    {report.violations.length} violations
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Made with Bob