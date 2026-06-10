import { useState } from 'react'
import {
  Search,
  Database,
  FileText,
  Cloud,
  Server,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  BarChart3,
  PieChart,
  Download,
} from 'lucide-react'

interface ScanResult {
  id: string
  source: string
  application: string
  environment: 'on-prem' | 'cloud' | 'hybrid'
  dataType: string
  piiCount: number
  entities: {
    type: string
    count: number
    severity: 'high' | 'medium' | 'low'
  }[]
  timestamp: string
  status: 'completed' | 'scanning' | 'failed'
}

export default function DataDiscovery() {
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>('all')
  const [selectedApplication, setSelectedApplication] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Mock data - replace with actual API calls
  const scanResults: ScanResult[] = [
    {
      id: '1',
      source: 'Customer Database',
      application: 'CRM System',
      environment: 'on-prem',
      dataType: 'Structured',
      piiCount: 1247,
      entities: [
        { type: 'EMAIL_ADDRESS', count: 523, severity: 'high' },
        { type: 'PHONE_NUMBER', count: 412, severity: 'medium' },
        { type: 'PERSON', count: 312, severity: 'medium' },
      ],
      timestamp: '2026-04-28T10:30:00Z',
      status: 'completed',
    },
    {
      id: '2',
      source: 'Application Logs',
      application: 'Web Portal',
      environment: 'cloud',
      dataType: 'Unstructured',
      piiCount: 89,
      entities: [
        { type: 'EMAIL_ADDRESS', count: 45, severity: 'high' },
        { type: 'IP_ADDRESS', count: 44, severity: 'low' },
      ],
      timestamp: '2026-04-28T09:15:00Z',
      status: 'completed',
    },
    {
      id: '3',
      source: 'API Gateway Logs',
      application: 'API Services',
      environment: 'hybrid',
      dataType: 'Semi-structured',
      piiCount: 342,
      entities: [
        { type: 'CREDIT_CARD', count: 156, severity: 'high' },
        { type: 'EMAIL_ADDRESS', count: 98, severity: 'high' },
        { type: 'PHONE_NUMBER', count: 88, severity: 'medium' },
      ],
      timestamp: '2026-04-28T08:45:00Z',
      status: 'completed',
    },
  ]

  const piiCategories = [
    { name: 'Email Addresses', count: 666, trend: '+12%', color: 'bg-red-500' },
    { name: 'Phone Numbers', count: 500, trend: '+8%', color: 'bg-orange-500' },
    { name: 'Credit Cards', count: 156, trend: '-5%', color: 'bg-purple-500' },
    { name: 'Person Names', count: 312, trend: '+15%', color: 'bg-blue-500' },
    { name: 'IP Addresses', count: 44, trend: '+3%', color: 'bg-green-500' },
  ]

  const environmentStats = [
    { name: 'On-Premise', count: 1247, percentage: 71 },
    { name: 'Cloud', count: 89, percentage: 5 },
    { name: 'Hybrid', count: 342, percentage: 24 },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Discovery & Classification</h1>
          <p className="mt-1 text-sm text-gray-500">
            Scan and classify PII across your sovereign infrastructure
          </p>
        </div>
        <button className="btn-primary">
          <Search className="h-5 w-5 mr-2" />
          New Scan
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div className="rounded-lg p-3 bg-blue-50">
              <Database className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-600">Total Data Sources</p>
            <p className="mt-1 text-3xl font-semibold text-gray-900">24</p>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div className="rounded-lg p-3 bg-red-50">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-600">PII Entities Found</p>
            <p className="mt-1 text-3xl font-semibold text-gray-900">1,678</p>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div className="rounded-lg p-3 bg-green-50">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-600">Scans Completed</p>
            <p className="mt-1 text-3xl font-semibold text-gray-900">156</p>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div className="rounded-lg p-3 bg-purple-50">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-600">Compliance Score</p>
            <p className="mt-1 text-3xl font-semibold text-gray-900">94%</p>
          </div>
        </div>
      </div>

      {/* PII Categories Heatmap */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">PII Categories Distribution</h2>
          <PieChart className="h-5 w-5 text-gray-400" />
        </div>
        <div className="space-y-4">
          {piiCategories.map((category) => (
            <div key={category.name}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{category.name}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold text-gray-900">{category.count}</span>
                  <span className="text-xs text-green-600">{category.trend}</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`${category.color} h-2 rounded-full`}
                  style={{ width: `${(category.count / 1678) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Environment Distribution */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Environment Distribution</h2>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {environmentStats.map((env) => (
              <div key={env.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {env.name === 'On-Premise' && <Server className="h-5 w-5 text-blue-500" />}
                  {env.name === 'Cloud' && <Cloud className="h-5 w-5 text-purple-500" />}
                  {env.name === 'Hybrid' && <Database className="h-5 w-5 text-green-500" />}
                  <span className="text-sm font-medium text-gray-700">{env.name}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-sovereign-600 h-2 rounded-full"
                      style={{ width: `${env.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 w-16 text-right">
                    {env.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Filters */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Environment
              </label>
              <select
                value={selectedEnvironment}
                onChange={(e) => setSelectedEnvironment(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sovereign-500 focus:outline-none focus:ring-1 focus:ring-sovereign-500"
              >
                <option value="all">All Environments</option>
                <option value="on-prem">On-Premise</option>
                <option value="cloud">Cloud</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Application
              </label>
              <select
                value={selectedApplication}
                onChange={(e) => setSelectedApplication(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sovereign-500 focus:outline-none focus:ring-1 focus:ring-sovereign-500"
              >
                <option value="all">All Applications</option>
                <option value="crm">CRM System</option>
                <option value="portal">Web Portal</option>
                <option value="api">API Services</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search data sources..."
                  className="w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 text-sm focus:border-sovereign-500 focus:outline-none focus:ring-1 focus:ring-sovereign-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scan Results Table */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Scans</h2>
            <button className="btn-secondary text-sm">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Application
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Environment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PII Found
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Top Entities
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {scanResults.map((result) => (
                <tr key={result.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{result.source}</div>
                        <div className="text-xs text-gray-500">{result.dataType}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {result.application}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        result.environment === 'on-prem'
                          ? 'bg-blue-100 text-blue-800'
                          : result.environment === 'cloud'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {result.environment}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-red-600">{result.piiCount}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {result.entities.slice(0, 2).map((entity) => (
                        <span
                          key={entity.type}
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            entity.severity === 'high'
                              ? 'bg-red-100 text-red-800'
                              : entity.severity === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {entity.type} ({entity.count})
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {result.status === 'completed' && (
                      <span className="inline-flex items-center text-sm text-green-600">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Completed
                      </span>
                    )}
                    {result.status === 'scanning' && (
                      <span className="inline-flex items-center text-sm text-blue-600">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        Scanning
                      </span>
                    )}
                    {result.status === 'failed' && (
                      <span className="inline-flex items-center text-sm text-red-600">
                        <XCircle className="h-4 w-4 mr-1" />
                        Failed
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button className="text-sovereign-600 hover:text-sovereign-900 font-medium">
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// Made with Bob