import { useState, useEffect } from 'react'
import {
  Shield,
  Plus,
  Trash2,
  Power,
  PowerOff,
  Search,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Settings,
  Play,
  X
} from 'lucide-react'
import { policyApi } from '@/lib/api'
import type { AnonymizationPolicy, Application, AnonymizationStats } from '@/types'

export default function AnonymizationControls() {
  const [applications, setApplications] = useState<Application[]>([])
  const [policies, setPolicies] = useState<AnonymizationPolicy[]>([])
  const [stats, setStats] = useState<AnonymizationStats | null>(null)
  const [selectedApp, setSelectedApp] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedPolicy, setSelectedPolicy] = useState<AnonymizationPolicy | null>(null)
  const [testText, setTestText] = useState('')
  const [testResult, setTestResult] = useState<any>(null)

  useEffect(() => {
    loadData()
  }, [selectedApp])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Try to load from API, fall back to mock data if endpoints don't exist
      try {
        const [appsData, policiesData, statsData] = await Promise.all([
          policyApi.listApplications(),
          policyApi.listPolicies(selectedApp !== 'all' ? selectedApp : undefined),
          policyApi.getStats(),
        ])
        setApplications(appsData)
        setPolicies(policiesData)
        setStats(statsData)
      } catch (apiError) {
        console.warn('API endpoints not available, using mock data:', apiError)
        // Load mock data
        setApplications(getMockApplications())
        setPolicies(getMockPolicies())
        setStats(getMockStats())
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Mock data generators
  const getMockApplications = (): Application[] => [
    {
      id: 'app-1',
      name: 'Customer Portal',
      description: 'Main customer-facing application',
      environment: 'production',
      policies_count: 3,
      anonymization_enabled: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'app-2',
      name: 'Analytics Service',
      description: 'Data analytics and reporting',
      environment: 'production',
      policies_count: 2,
      anonymization_enabled: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'app-3',
      name: 'Admin Dashboard',
      description: 'Internal admin tools',
      environment: 'staging',
      policies_count: 1,
      anonymization_enabled: false,
      created_at: new Date().toISOString(),
    },
  ]

  const getMockPolicies = (): AnonymizationPolicy[] => [
    {
      id: 'policy-1',
      name: 'PII Protection Policy',
      description: 'Protect all PII data in customer logs',
      application_id: 'app-1',
      application_name: 'Customer Portal',
      enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      rules: [
        {
          id: 'rule-1',
          entity_type: 'EMAIL_ADDRESS',
          operator_type: 'hash',
          operator_config: { type: 'hash' },
          enabled: true,
          priority: 1,
        },
        {
          id: 'rule-2',
          entity_type: 'PHONE_NUMBER',
          operator_type: 'mask',
          operator_config: { type: 'mask', masking_char: '*', chars_to_mask: 4, from_end: true },
          enabled: true,
          priority: 2,
        },
        {
          id: 'rule-3',
          entity_type: 'CREDIT_CARD',
          operator_type: 'redact',
          operator_config: { type: 'redact' },
          enabled: true,
          priority: 3,
        },
      ],
    },
    {
      id: 'policy-2',
      name: 'Analytics Data Policy',
      description: 'Hash sensitive data before analytics processing',
      application_id: 'app-2',
      application_name: 'Analytics Service',
      enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      rules: [
        {
          id: 'rule-4',
          entity_type: 'EMAIL_ADDRESS',
          operator_type: 'hash',
          operator_config: { type: 'hash' },
          enabled: true,
          priority: 1,
        },
        {
          id: 'rule-5',
          entity_type: 'US_SSN',
          operator_type: 'redact',
          operator_config: { type: 'redact' },
          enabled: true,
          priority: 2,
        },
      ],
    },
    {
      id: 'policy-3',
      name: 'Admin Logs Policy',
      description: 'Mask PAN data in admin logs',
      application_id: 'app-3',
      application_name: 'Admin Dashboard',
      enabled: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      rules: [
        {
          id: 'rule-6',
          entity_type: 'CREDIT_CARD',
          operator_type: 'mask',
          operator_config: { type: 'mask', masking_char: 'X', chars_to_mask: 12, from_end: false },
          enabled: true,
          priority: 1,
        },
      ],
    },
  ]

  const getMockStats = (): AnonymizationStats => ({
    total_policies: 3,
    active_policies: 2,
    total_applications: 3,
    entities_processed_today: 15847,
    entities_anonymized_today: 12456,
  })

  const toggleApplicationAnonymization = async (appId: string, enabled: boolean) => {
    try {
      await policyApi.toggleApplicationAnonymization(appId, enabled)
      await loadData()
    } catch (error) {
      console.error('Failed to toggle application:', error)
    }
  }

  const togglePolicy = async (policyId: string, enabled: boolean) => {
    try {
      await policyApi.togglePolicy(policyId, enabled)
      await loadData()
    } catch (error) {
      console.error('Failed to toggle policy:', error)
    }
  }

  const toggleRule = async (policyId: string, ruleId: string, enabled: boolean) => {
    try {
      await policyApi.toggleRule(policyId, ruleId, enabled)
      await loadData()
    } catch (error) {
      console.error('Failed to toggle rule:', error)
    }
  }

  const deletePolicy = async (policyId: string) => {
    if (!confirm('Are you sure you want to delete this policy?')) return
    try {
      await policyApi.deletePolicy(policyId)
      await loadData()
    } catch (error) {
      console.error('Failed to delete policy:', error)
    }
  }

  const testPolicy = async (policyId: string) => {
    if (!testText.trim()) return
    try {
      const result = await policyApi.testPolicy(policyId, testText)
      setTestResult(result)
    } catch (error) {
      console.error('Failed to test policy:', error)
    }
  }

  const filteredPolicies = policies?.filter(policy =>
    policy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    policy.description.toLowerCase().includes(searchQuery.toLowerCase())
  )??[];

  const getOperatorIcon = (type: string) => {
    switch (type) {
      case 'redact': return '█'
      case 'mask': return '***'
      case 'hash': return '#'
      case 'replace': return '→'
      case 'encrypt': return '🔒'
      default: return '?'
    }
  }

  const getOperatorColor = (type: string) => {
    switch (type) {
      case 'redact': return 'bg-red-100 text-red-800'
      case 'mask': return 'bg-yellow-100 text-yellow-800'
      case 'hash': return 'bg-purple-100 text-purple-800'
      case 'replace': return 'bg-blue-100 text-blue-800'
      case 'encrypt': return 'bg-green-100 text-green-800'
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
          <h1 className="text-2xl font-bold text-gray-900">Anonymization Controls</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage real-time anonymization policies and masking rules
          </p>
        </div>
        <button
          onClick={() => alert('Create new policy - Feature coming soon')}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Policy
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Policies</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_policies}</p>
              </div>
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Policies</p>
                <p className="text-2xl font-bold text-green-600">{stats.active_policies}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Applications</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_applications}</p>
              </div>
              <Settings className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Anonymized Today</p>
                <p className="text-2xl font-bold text-gray-900">{stats.entities_anonymized_today}</p>
              </div>
              <Eye className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>
      )}

      {/* Applications Section */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Applications</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {applications.map((app) => (
            <div
              key={app.id}
              className="border rounded-lg p-4 hover:border-blue-500 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{app.name}</h3>
                  <p className="text-sm text-gray-500">{app.description}</p>
                </div>
                <button
                  onClick={() => toggleApplicationAnonymization(app.id, !app.anonymization_enabled)}
                  className={`p-2 rounded-lg transition-colors ${
                    app.anonymization_enabled
                      ? 'bg-green-100 text-green-600 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  }`}
                  title={app.anonymization_enabled ? 'Disable anonymization' : 'Enable anonymization'}
                >
                  {app.anonymization_enabled ? (
                    <Power className="w-4 h-4" />
                  ) : (
                    <PowerOff className="w-4 h-4" />
                  )}
                </button>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  app.environment === 'production' ? 'bg-red-100 text-red-800' :
                  app.environment === 'staging' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {app.environment}
                </span>
                <span className="text-gray-600">{app.policies_count} policies</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search policies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
          <select
            value={selectedApp}
            onChange={(e) => setSelectedApp(e.target.value)}
            className="input w-full sm:w-64"
          >
            <option value="all">All Applications</option>
            {applications.map((app) => (
              <option key={app.id} value={app.id}>
                {app.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Policies List */}
      <div className="space-y-4">
        {filteredPolicies.length === 0 ? (
          <div className="card p-12 text-center">
            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No policies found</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery ? 'Try adjusting your search' : 'Create your first anonymization policy'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => alert('Create new policy - Feature coming soon')}
                className="btn-primary"
              >
                Create Policy
              </button>
            )}
          </div>
        ) : (
          filteredPolicies.map((policy) => (
            <div key={policy.id} className="card">
              {/* Policy Header */}
              <div className="p-6 border-b">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{policy.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        policy.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {policy.enabled ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{policy.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>App: {policy.application_name}</span>
                      <span>•</span>
                      <span>{policy.rules.length} rules</span>
                      <span>•</span>
                      <span>Updated {new Date(policy.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => togglePolicy(policy.id, !policy.enabled)}
                      className={`p-2 rounded-lg transition-colors ${
                        policy.enabled
                          ? 'bg-green-100 text-green-600 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                      title={policy.enabled ? 'Disable policy' : 'Enable policy'}
                    >
                      {policy.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPolicy(policy)
                        setTestText('')
                        setTestResult(null)
                      }}
                      className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200"
                      title="Test policy"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => alert('Add new rule - Feature coming soon')}
                      className="p-2 rounded-lg bg-purple-100 text-purple-600 hover:bg-purple-200"
                      title="Add rule"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deletePolicy(policy.id)}
                      className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200"
                      title="Delete policy"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Masking Rules */}
              <div className="p-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Masking Rules</h4>
                {policy.rules.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p>No masking rules defined</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {policy.rules
                      .sort((a, b) => a.priority - b.priority)
                      .map((rule) => (
                        <div
                          key={rule.id}
                          className={`flex items-center justify-between p-4 rounded-lg border ${
                            rule.enabled ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <span className="text-2xl font-mono">{getOperatorIcon(rule.operator_type)}</span>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-gray-900">{rule.entity_type}</span>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getOperatorColor(rule.operator_type)}`}>
                                  {rule.operator_type}
                                </span>
                                <span className="text-xs text-gray-500">Priority: {rule.priority}</span>
                              </div>
                              <div className="text-sm text-gray-600">
                                {rule.operator_type === 'mask' && rule.operator_config.masking_char && (
                                  <span>Mask with '{rule.operator_config.masking_char}' • </span>
                                )}
                                {rule.operator_config.chars_to_mask && (
                                  <span>Chars: {rule.operator_config.chars_to_mask} • </span>
                                )}
                                {rule.operator_config.from_end !== undefined && (
                                  <span>From {rule.operator_config.from_end ? 'end' : 'start'}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleRule(policy.id, rule.id, !rule.enabled)}
                              className={`p-2 rounded-lg transition-colors ${
                                rule.enabled
                                  ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                              }`}
                            >
                              {rule.enabled ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Test Section */}
              {selectedPolicy?.id === policy.id && (
                <div className="p-6 bg-gray-50 border-t">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Test Policy</h4>
                  <div className="space-y-3">
                    <textarea
                      value={testText}
                      onChange={(e) => setTestText(e.target.value)}
                      placeholder="Enter text to test anonymization..."
                      className="input w-full h-24 resize-none"
                    />
                    <button
                      onClick={() => testPolicy(policy.id)}
                      disabled={!testText.trim()}
                      className="btn-primary"
                    >
                      Test Anonymization
                    </button>
                    {testResult && (
                      <div className="mt-4 p-4 bg-white rounded-lg border">
                        <h5 className="text-sm font-semibold text-gray-700 mb-2">Result:</h5>
                        <pre className="text-sm text-gray-900 whitespace-pre-wrap">{testResult.anonymized_text}</pre>
                        <div className="mt-2 text-xs text-gray-500">
                          Detected: {testResult.entities_detected?.length || 0} entities
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Quick Actions Panel */}
      <div className="card p-6 bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 bg-white rounded-lg border border-blue-200 hover:border-blue-400 transition-colors text-left">
            <Shield className="w-6 h-6 text-blue-600 mb-2" />
            <h4 className="font-medium text-gray-900 mb-1">Mask all PAN data</h4>
            <p className="text-sm text-gray-600">Apply PAN masking to all applications</p>
          </button>
          <button className="p-4 bg-white rounded-lg border border-blue-200 hover:border-blue-400 transition-colors text-left">
            <Shield className="w-6 h-6 text-purple-600 mb-2" />
            <h4 className="font-medium text-gray-900 mb-1">Hash emails</h4>
            <p className="text-sm text-gray-600">Hash email addresses before analytics</p>
          </button>
          <button className="p-4 bg-white rounded-lg border border-blue-200 hover:border-blue-400 transition-colors text-left">
            <Shield className="w-6 h-6 text-green-600 mb-2" />
            <h4 className="font-medium text-gray-900 mb-1">Redact SSN</h4>
            <p className="text-sm text-gray-600">Completely redact SSN in logs</p>
          </button>
        </div>
      </div>
    </div>
  )
}

// Made with Bob