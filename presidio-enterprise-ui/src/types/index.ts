// Core Presidio Types

export interface AnalyzerResult {
  entity_type: string
  start: number
  end: number
  score: number
}

export interface AnonymizeRequest {
  text: string
  analyzer_results: AnalyzerResult[]
  operators?: Record<string, OperatorConfig>
}

export interface OperatorConfig {
  type: 'replace' | 'mask' | 'redact' | 'hash' | 'encrypt'
  masking_char?: string
  chars_to_mask?: number
  from_end?: boolean
}

export interface AnonymizeResponse {
  text: string
  items: AnonymizedItem[]
}

export interface AnonymizedItem {
  start: number
  end: number
  entity_type: string
  text: string
  operator: string
}

export interface ProcessRequest {
  text: string
  language?: string
  score_threshold?: number
  operators?: Record<string, OperatorConfig>
}

export interface ProcessResponse {
  original_text: string
  anonymized_text: string
  entities_detected: AnalyzerResult[]
  entities_anonymized: number
}

// Instance Management Types

export interface PresidioInstance {
  id: string
  name: string
  namespace: string
  cluster_url: string
  status: 'running' | 'pending' | 'failed' | 'stopped'
  created_at: string
  updated_at: string
  config: InstanceConfig
  health: InstanceHealth
}

export interface InstanceConfig {
  analyzer_replicas: number
  anonymizer_replicas: number
  analyzer_cpu_request: string
  analyzer_memory_request: string
  analyzer_cpu_limit: string
  analyzer_memory_limit: string
  anonymizer_cpu_request: string
  anonymizer_memory_request: string
  anonymizer_cpu_limit: string
  anonymizer_memory_limit: string
  log_level: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR'
  supported_languages: string[]
  default_score_threshold: number
  enable_metering: boolean
}

export interface InstanceHealth {
  analyzer_healthy: boolean
  anonymizer_healthy: boolean
  last_check: string
}

// Cluster Management Types

export interface Cluster {
  id: string
  name: string
  url: string
  type: 'kubernetes' | 'openshift' | 'eks' | 'aks' | 'gke'
  region: string
  status: 'connected' | 'disconnected' | 'error'
  instances_count: number
  created_at: string
}

// Monitoring Types

export interface MetricData {
  timestamp: string
  value: number
}

export interface InstanceMetrics {
  instance_id: string
  analyzer_api_calls: MetricData[]
  anonymizer_api_calls: MetricData[]
  data_processed_bytes: MetricData[]
  pii_entities_detected: MetricData[]
  pii_entities_anonymized: MetricData[]
  cpu_usage_cores: MetricData[]
  memory_usage_gb: MetricData[]
}

// Audit & Compliance Types

export interface AuditLog {
  id: string
  timestamp: string
  instance_id: string
  application_id?: string
  application_name?: string
  operation: 'analyze' | 'anonymize' | 'process' | 'policy_change' | 'access'
  user: string
  user_role?: string
  entity_types: string[]
  entities_count: number
  pii_detected: number
  pii_anonymized: number
  success: boolean
  duration_ms?: number
  source_ip?: string
  metadata: Record<string, any>
}

export interface PIIDetectionLog {
  id: string
  timestamp: string
  application_id: string
  application_name: string
  entity_type: string
  entity_value_hash: string
  confidence_score: number
  location: string
  detected_by: string
  action_taken: 'anonymized' | 'flagged' | 'blocked' | 'allowed'
}

export interface AnonymizationLog {
  id: string
  timestamp: string
  application_id: string
  application_name: string
  policy_id: string
  policy_name: string
  entity_type: string
  operator_type: string
  entities_processed: number
  success: boolean
  user: string
}

export interface ComplianceReport {
  id: string
  period_start: string
  period_end: string
  report_type: 'gdpr' | 'hipaa' | 'ccpa' | 'general'
  total_operations: number
  pii_detected: number
  pii_anonymized: number
  compliance_score: number
  violations: ComplianceViolation[]
  top_risky_applications: RiskyApplication[]
  pii_exposure_trend: TrendData[]
  entity_type_breakdown: EntityTypeStats[]
}

export interface ComplianceViolation {
  id: string
  timestamp: string
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  instance_id: string
  application_id?: string
  application_name?: string
  regulation: 'gdpr' | 'hipaa' | 'ccpa' | 'general'
  remediation_status: 'open' | 'in_progress' | 'resolved' | 'accepted_risk'
  assigned_to?: string
}

export interface RiskyApplication {
  application_id: string
  application_name: string
  risk_score: number
  pii_exposure_count: number
  unprotected_pii_count: number
  violations_count: number
  last_incident: string
}

export interface TrendData {
  timestamp: string
  value: number
  label?: string
}

export interface EntityTypeStats {
  entity_type: string
  count: number
  percentage: number
  anonymized_count: number
  anonymization_rate: number
}

export interface AuditStats {
  total_logs: number
  today_logs: number
  pii_detected_today: number
  pii_anonymized_today: number
  anonymization_rate: number
  top_users: UserActivity[]
  top_applications: ApplicationActivity[]
  recent_violations: ComplianceViolation[]
}

export interface UserActivity {
  user: string
  operations_count: number
  pii_detected: number
  last_activity: string
}

export interface ApplicationActivity {
  application_id: string
  application_name: string
  operations_count: number
  pii_detected: number
  pii_anonymized: number
  risk_level: 'low' | 'medium' | 'high' | 'critical'
}

// User Management Types

export interface User {
  id: string
  username: string
  email: string
  role: 'admin' | 'operator' | 'viewer'
  created_at: string
  last_login: string
  permissions: Permission[]
}

export interface Permission {
  resource: string
  actions: ('read' | 'write' | 'delete' | 'execute')[]
}

// Batch Processing Types

export interface BatchJob {
  id: string
  name: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  created_at: string
  completed_at?: string
  files_count: number
  files_processed: number
  entities_detected: number
  entities_anonymized: number
  error?: string
}

export interface FileProcessResult {
  filename: string
  status: 'success' | 'failed'
  entities_detected: number
  entities_anonymized: number
  error?: string
}

// Configuration Types

export interface SystemConfiguration {
  default_language: string
  default_score_threshold: number
  max_file_size_mb: number
  batch_processing_enabled: boolean
  metering_enabled: boolean
  audit_logging_enabled: boolean
  retention_days: number
}

// Anonymization Policy Types

export interface AnonymizationPolicy {
  id: string
  name: string
  description: string
  application_id: string
  application_name: string
  enabled: boolean
  created_at: string
  updated_at: string
  rules: MaskingRule[]
}

export interface MaskingRule {
  id: string
  entity_type: string
  operator_type: 'replace' | 'mask' | 'redact' | 'hash' | 'encrypt'
  operator_config: OperatorConfig
  enabled: boolean
  priority: number
}

export interface Application {
  id: string
  name: string
  description: string
  environment: 'development' | 'staging' | 'production'
  policies_count: number
  anonymization_enabled: boolean
  created_at: string
}

export interface AnonymizationStats {
  total_policies: number
  active_policies: number
  total_applications: number
  entities_processed_today: number
  entities_anonymized_today: number
}

// API Response Types

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

// Made with Bob
