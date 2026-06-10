import axios from 'axios'
import type {
  AnalyzerResult,
  AnonymizeRequest,
  AnonymizeResponse,
  ProcessRequest,
  ProcessResponse,
  PresidioInstance,
  Cluster,
  InstanceMetrics,
  AuditLog,
  ComplianceReport,
  User,
  BatchJob,
  SystemConfiguration,
  PaginatedResponse,
  AnonymizationPolicy,
  MaskingRule,
  Application,
  AnonymizationStats,
  RiskyApplication,
  TrendData,
  EntityTypeStats,
  AuditStats,
} from '@/types'

const createMockBlob = (content: string, type: string) => new Blob([content], { type })

const mockNow = () => new Date()

const getMockApplications = (): Application[] => [
  {
    id: 'app-1',
    name: 'Customer Portal',
    description: 'Main customer-facing application',
    environment: 'production',
    policies_count: 3,
    anonymization_enabled: true,
    created_at: mockNow().toISOString(),
  },
  {
    id: 'app-2',
    name: 'Analytics Service',
    description: 'Data analytics and reporting',
    environment: 'production',
    policies_count: 2,
    anonymization_enabled: true,
    created_at: mockNow().toISOString(),
  },
  {
    id: 'app-3',
    name: 'Admin Dashboard',
    description: 'Internal admin tools',
    environment: 'staging',
    policies_count: 1,
    anonymization_enabled: false,
    created_at: mockNow().toISOString(),
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
    created_at: mockNow().toISOString(),
    updated_at: mockNow().toISOString(),
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
    created_at: mockNow().toISOString(),
    updated_at: mockNow().toISOString(),
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
    created_at: mockNow().toISOString(),
    updated_at: mockNow().toISOString(),
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

const getMockAnonymizationStats = (): AnonymizationStats => ({
  total_policies: 3,
  active_policies: 2,
  total_applications: 3,
  entities_processed_today: 15847,
  entities_anonymized_today: 12456,
})

const getMockTrendData = (days = 30): TrendData[] => {
  const data: TrendData[] = []
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    data.push({
      timestamp: date.toISOString(),
      value: 300 + ((i * 17) % 100),
      label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    })
  }
  return data
}

const getMockRiskyApplications = (): RiskyApplication[] => [
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

const getMockEntityTypeBreakdown = (): EntityTypeStats[] => [
  { entity_type: 'EMAIL_ADDRESS', count: 4523, percentage: 36.3, anonymized_count: 4401, anonymization_rate: 97.3 },
  { entity_type: 'PHONE_NUMBER', count: 3234, percentage: 26.0, anonymized_count: 3156, anonymization_rate: 97.6 },
  { entity_type: 'CREDIT_CARD', count: 2156, percentage: 17.3, anonymized_count: 2089, anonymization_rate: 96.9 },
  { entity_type: 'US_SSN', count: 1456, percentage: 11.7, anonymized_count: 1423, anonymization_rate: 97.7 },
  { entity_type: 'PERSON', count: 1087, percentage: 8.7, anonymized_count: 1054, anonymization_rate: 97.0 },
]

const getMockComplianceReports = (
  reportType: 'gdpr' | 'hipaa' | 'ccpa' | 'general' = 'general'
): ComplianceReport[] => {
  const now = new Date()
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

  return [
    {
      id: `report-${reportType}-1`,
      period_start: lastMonth.toISOString(),
      period_end: lastMonthEnd.toISOString(),
      report_type: reportType,
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
          regulation: reportType,
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
          regulation: reportType,
          remediation_status: 'resolved',
          assigned_to: 'data-team@company.com',
        },
      ],
      top_risky_applications: getMockRiskyApplications(),
      pii_exposure_trend: getMockTrendData(),
      entity_type_breakdown: getMockEntityTypeBreakdown(),
    },
    {
      id: `report-${reportType}-2`,
      period_start: new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString(),
      period_end: new Date(now.getFullYear(), now.getMonth() - 1, 0).toISOString(),
      report_type: reportType,
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

const getMockAuditStats = (): AuditStats => ({
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

const buildMockAuditLogPage = (
  page = 1,
  pageSize = 50,
  filters?: Record<string, any>
): PaginatedResponse<AuditLog> => {
  let items = getMockAuditLogs()

  if (filters?.operation) {
    items = items.filter((log) => log.operation === filters.operation)
  }
  if (typeof filters?.success === 'boolean') {
    items = items.filter((log) => log.success === filters.success)
  }

  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const start = (page - 1) * pageSize

  return {
    items: items.slice(start, start + pageSize),
    total,
    page,
    page_size: pageSize,
    total_pages: totalPages,
  }
}

const mockPolicyTestResult = (policyId: string, testText: string) => {
  const anonymizedText = testText
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[EMAIL_HASH]')
    .replace(/\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b/g, '[SSN_REDACTED]')
    .replace(/\b(?:\d[ -]*?){13,16}\b/g, '[CARD_REDACTED]')
    .replace(/\b(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?){2}\d{4}\b/g, '(***) ***-1234')

  return {
    policy_id: policyId,
    anonymized_text: anonymizedText,
    entities_detected: [
      { entity_type: 'EMAIL_ADDRESS', start: 0, end: 0, score: 0.99 },
      { entity_type: 'PHONE_NUMBER', start: 0, end: 0, score: 0.97 },
    ],
  }
}

// API Client Configuration
const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for auth tokens
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Analyzer API
export const analyzerApi = {
  analyze: async (text: string, language = 'en', scoreThreshold = 0.5): Promise<AnalyzerResult[]> => {
    const { data } = await api.post('/analyzer/analyze', {
      text,
      language,
      score_threshold: scoreThreshold,
    })
    return data
  },

  analyzeFile: async (file: File, language = 'en', scoreThreshold = 0.5) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('language', language)
    formData.append('score_threshold', scoreThreshold.toString())

    const { data } = await api.post('/analyzer/analyze/file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  health: async () => {
    const { data } = await api.get('/analyzer/health')
    return data
  },
}

// Anonymizer API
export const anonymizerApi = {
  anonymize: async (request: AnonymizeRequest): Promise<AnonymizeResponse> => {
    const { data } = await api.post('/anonymizer/anonymize', request)
    return data
  },

  process: async (request: ProcessRequest): Promise<ProcessResponse> => {
    const { data } = await api.post('/anonymizer/process', request)
    return data
  },

  processFile: async (
    file: File,
    language = 'en',
    scoreThreshold = 0.5,
    anonymizationStrategy = 'replace'
  ) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('language', language)
    formData.append('score_threshold', scoreThreshold.toString())
    formData.append('anonymization_strategy', anonymizationStrategy)

    const { data } = await api.post('/anonymizer/process/file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  health: async () => {
    const { data } = await api.get('/anonymizer/health')
    return data
  },
}

// Instance Management API
export const instanceApi = {
  list: async (): Promise<PresidioInstance[]> => {
    const { data } = await api.get('/instances')
    return data
  },

  get: async (id: string): Promise<PresidioInstance> => {
    const { data } = await api.get(`/instances/${id}`)
    return data
  },

  create: async (config: Partial<PresidioInstance>): Promise<PresidioInstance> => {
    const { data } = await api.post('/instances', config)
    return data
  },

  update: async (id: string, config: Partial<PresidioInstance>): Promise<PresidioInstance> => {
    const { data } = await api.put(`/instances/${id}`, config)
    return data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/instances/${id}`)
  },

  start: async (id: string): Promise<void> => {
    await api.post(`/instances/${id}/start`)
  },

  stop: async (id: string): Promise<void> => {
    await api.post(`/instances/${id}/stop`)
  },

  restart: async (id: string): Promise<void> => {
    await api.post(`/instances/${id}/restart`)
  },

  health: async (id: string) => {
    const { data } = await api.get(`/instances/${id}/health`)
    return data
  },
}

// Cluster Management API
export const clusterApi = {
  list: async (): Promise<Cluster[]> => {
    const { data } = await api.get('/clusters')
    return data
  },

  get: async (id: string): Promise<Cluster> => {
    const { data } = await api.get(`/clusters/${id}`)
    return data
  },

  create: async (cluster: Partial<Cluster>): Promise<Cluster> => {
    const { data } = await api.post('/clusters', cluster)
    return data
  },

  update: async (id: string, cluster: Partial<Cluster>): Promise<Cluster> => {
    const { data } = await api.put(`/clusters/${id}`, cluster)
    return data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/clusters/${id}`)
  },

  testConnection: async (id: string) => {
    const { data } = await api.post(`/clusters/${id}/test`)
    return data
  },
}

// Monitoring API
export const monitoringApi = {
  getMetrics: async (instanceId: string, timeRange = '1h'): Promise<InstanceMetrics> => {
    const { data } = await api.get(`/monitoring/instances/${instanceId}/metrics`, {
      params: { time_range: timeRange },
    })
    return data
  },

  getSystemMetrics: async (timeRange = '1h') => {
    const { data } = await api.get('/monitoring/system/metrics', {
      params: { time_range: timeRange },
    })
    return data
  },

  getAlerts: async () => {
    const { data } = await api.get('/monitoring/alerts')
    return data
  },
}

// Compliance API
export const complianceApi = {
  getAuditLogs: async (
    page = 1,
    pageSize = 50,
    filters?: Record<string, any>
  ): Promise<PaginatedResponse<AuditLog>> => {
    const { data } = await api.get('/compliance/audit-logs', {
      params: { page, page_size: pageSize, ...filters },
    })
    return data
  },

  getReports: async (): Promise<ComplianceReport[]> => {
    const { data } = await api.get('/compliance/reports')
    return data
  },

  generateReport: async (periodStart: string, periodEnd: string): Promise<ComplianceReport> => {
    const { data } = await api.post('/compliance/reports', {
      period_start: periodStart,
      period_end: periodEnd,
    })
    return data
  },

  exportReport: async (reportId: string, format: 'pdf' | 'csv' | 'json') => {
    const { data } = await api.get(`/compliance/reports/${reportId}/export`, {
      params: { format },
      responseType: 'blob',
    })
    return data
  },
}

// User Management API
export const userApi = {
  list: async (): Promise<User[]> => {
    const { data } = await api.get('/users')
    return data
  },

  get: async (id: string): Promise<User> => {
    const { data } = await api.get(`/users/${id}`)
    return data
  },

  create: async (user: Partial<User>): Promise<User> => {
    const { data } = await api.post('/users', user)
    return data
  },

  update: async (id: string, user: Partial<User>): Promise<User> => {
    const { data } = await api.put(`/users/${id}`, user)
    return data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`)
  },

  getCurrentUser: async (): Promise<User> => {
    const { data } = await api.get('/users/me')
    return data
  },
}

// Batch Processing API
export const batchApi = {
  list: async (): Promise<BatchJob[]> => {
    const { data } = await api.get('/batch/jobs')
    return data
  },

  get: async (id: string): Promise<BatchJob> => {
    const { data } = await api.get(`/batch/jobs/${id}`)
    return data
  },

  create: async (files: File[], config: any): Promise<BatchJob> => {
    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))
    formData.append('config', JSON.stringify(config))

    const { data } = await api.post('/batch/jobs', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  cancel: async (id: string): Promise<void> => {
    await api.post(`/batch/jobs/${id}/cancel`)
  },

  downloadResults: async (id: string) => {
    const { data } = await api.get(`/batch/jobs/${id}/results`, {
      responseType: 'blob',
    })
    return data
  },
}

// Configuration API
export const configApi = {
  get: async (): Promise<SystemConfiguration> => {
    const { data } = await api.get('/configuration')
    return data
  },

  update: async (config: Partial<SystemConfiguration>): Promise<SystemConfiguration> => {
    const { data } = await api.put('/configuration', config)
    return data
  },

  reset: async (): Promise<SystemConfiguration> => {
    const { data } = await api.post('/configuration/reset')
    return data
  },
}

// Anonymization Policy API
export const policyApi = {
  // Applications
  listApplications: async (): Promise<Application[]> => {
    return getMockApplications()
  },

  getApplication: async (id: string): Promise<Application> => {
    const { data } = await api.get(`/policies/applications/${id}`)
    return data
  },

  createApplication: async (app: Partial<Application>): Promise<Application> => {
    const { data } = await api.post('/policies/applications', app)
    return data
  },

  updateApplication: async (id: string, app: Partial<Application>): Promise<Application> => {
    const { data } = await api.put(`/policies/applications/${id}`, app)
    return data
  },

  deleteApplication: async (id: string): Promise<void> => {
    await api.delete(`/policies/applications/${id}`)
  },

  toggleApplicationAnonymization: async (id: string, enabled: boolean): Promise<Application> => {
    const app = getMockApplications().find((item) => item.id === id)
    if (!app) {
      throw new Error(`Application not found: ${id}`)
    }
    return { ...app, anonymization_enabled: enabled }
  },

  // Policies
  listPolicies: async (applicationId?: string): Promise<AnonymizationPolicy[]> => {
    const policies = getMockPolicies()
    return applicationId ? policies.filter((policy) => policy.application_id === applicationId) : policies
  },

  getPolicy: async (id: string): Promise<AnonymizationPolicy> => {
    const { data } = await api.get(`/policies/${id}`)
    return data
  },

  createPolicy: async (policy: Partial<AnonymizationPolicy>): Promise<AnonymizationPolicy> => {
    const { data } = await api.post('/policies', policy)
    return data
  },

  updatePolicy: async (id: string, policy: Partial<AnonymizationPolicy>): Promise<AnonymizationPolicy> => {
    const { data } = await api.put(`/policies/${id}`, policy)
    return data
  },

  deletePolicy: async (id: string): Promise<void> => {
    const exists = getMockPolicies().some((policy) => policy.id === id)
    if (!exists) {
      throw new Error(`Policy not found: ${id}`)
    }
  },

  togglePolicy: async (id: string, enabled: boolean): Promise<AnonymizationPolicy> => {
    const policy = getMockPolicies().find((item) => item.id === id)
    if (!policy) {
      throw new Error(`Policy not found: ${id}`)
    }
    return { ...policy, enabled, updated_at: new Date().toISOString() }
  },

  // Masking Rules
  addRule: async (policyId: string, rule: Partial<MaskingRule>): Promise<MaskingRule> => {
    const { data } = await api.post(`/policies/${policyId}/rules`, rule)
    return data
  },

  updateRule: async (policyId: string, ruleId: string, rule: Partial<MaskingRule>): Promise<MaskingRule> => {
    const { data } = await api.put(`/policies/${policyId}/rules/${ruleId}`, rule)
    return data
  },

  deleteRule: async (policyId: string, ruleId: string): Promise<void> => {
    await api.delete(`/policies/${policyId}/rules/${ruleId}`)
  },

  toggleRule: async (policyId: string, ruleId: string, enabled: boolean): Promise<MaskingRule> => {
    const policy = getMockPolicies().find((item) => item.id === policyId)
    const rule = policy?.rules.find((item) => item.id === ruleId)
    if (!rule) {
      throw new Error(`Rule not found: ${ruleId}`)
    }
    return { ...rule, enabled }
  },

  // Statistics
  getStats: async (): Promise<AnonymizationStats> => {
    return getMockAnonymizationStats()
  },

  // Test Policy
  testPolicy: async (policyId: string, testText: string) => {
    return mockPolicyTestResult(policyId, testText)
  },
}
// Audit & Compliance API
export const auditApi = {
  // Audit Logs
  getAuditLogs: async (
    page = 1,
    pageSize = 50,
    filters?: Record<string, any>
  ): Promise<PaginatedResponse<AuditLog>> => {
    return buildMockAuditLogPage(page, pageSize, filters)
  },

  getPIIDetectionLogs: async (
    page = 1,
    pageSize = 50,
    filters?: Record<string, any>
  ) => {
    const { data } = await api.get('/audit/pii-detections', {
      params: { page, page_size: pageSize, ...filters },
    })
    return data
  },

  getAnonymizationLogs: async (
    page = 1,
    pageSize = 50,
    filters?: Record<string, any>
  ) => {
    const { data } = await api.get('/audit/anonymizations', {
      params: { page, page_size: pageSize, ...filters },
    })
    return data
  },

  getAuditStats: async () => {
    return getMockAuditStats()
  },

  exportAuditLogs: async (filters?: Record<string, any>, format: 'csv' | 'json' = 'csv') => {
    const payload = buildMockAuditLogPage(1, 1000, filters).items
    const content = format === 'json'
      ? JSON.stringify(payload, null, 2)
      : ['id,timestamp,application,operation,user,pii_detected,pii_anonymized,success']
          .concat(
            payload.map((log) =>
              [log.id, log.timestamp, log.application_name ?? '', log.operation, log.user, log.pii_detected, log.pii_anonymized, log.success].join(',')
            )
          )
          .join('\n')
    return createMockBlob(content, format === 'json' ? 'application/json' : 'text/csv')
  },

  // Compliance Reports
  getComplianceReports: async (reportType?: string): Promise<ComplianceReport[]> => {
    return getMockComplianceReports((reportType as 'gdpr' | 'hipaa' | 'ccpa' | 'general' | undefined) ?? 'general')
  },

  getComplianceReport: async (id: string): Promise<ComplianceReport> => {
    const { data } = await api.get(`/compliance/reports/${id}`)
    return data
  },

  generateComplianceReport: async (
    reportType: 'gdpr' | 'hipaa' | 'ccpa' | 'general',
    periodStart: string,
    periodEnd: string
  ): Promise<ComplianceReport> => {
    return {
      ...getMockComplianceReports(reportType)[0],
      id: `report-${reportType}-${Date.now()}`,
      period_start: periodStart,
      period_end: periodEnd,
    }
  },

  exportComplianceReport: async (reportId: string, format: 'pdf' | 'csv' | 'json' = 'pdf') => {
    const report = getMockComplianceReports('general').find((item) => item.id === reportId) ?? getMockComplianceReports('general')[0]
    const content = format === 'json'
      ? JSON.stringify(report, null, 2)
      : format === 'csv'
        ? [
            'id,report_type,period_start,period_end,total_operations,pii_detected,pii_anonymized,compliance_score',
            [report.id, report.report_type, report.period_start, report.period_end, report.total_operations, report.pii_detected, report.pii_anonymized, report.compliance_score].join(','),
          ].join('\n')
        : `Compliance Report ${report.id}\nType: ${report.report_type}\nScore: ${report.compliance_score}%`
    return createMockBlob(
      content,
      format === 'json' ? 'application/json' : format === 'csv' ? 'text/csv' : 'application/pdf'
    )
  },

  // Violations
  getViolations: async (
    page = 1,
    pageSize = 50,
    filters?: Record<string, any>
  ) => {
    const { data } = await api.get('/compliance/violations', {
      params: { page, page_size: pageSize, ...filters },
    })
    return data
  },

  updateViolationStatus: async (
    violationId: string,
    status: string,
    assignedTo?: string
  ) => {
    const { data } = await api.patch(`/compliance/violations/${violationId}`, {
      remediation_status: status,
      assigned_to: assignedTo,
    })
    return data
  },

  // Risk Analysis
  getRiskyApplications: async (): Promise<RiskyApplication[]> => {
    return getMockRiskyApplications()
  },

  getPIIExposureTrend: async (days = 30): Promise<TrendData[]> => {
    return getMockTrendData(days)
  },

  getEntityTypeBreakdown: async (_periodStart?: string, _periodEnd?: string) => {
    return getMockEntityTypeBreakdown()
  },
}


export default api

// Made with Bob
