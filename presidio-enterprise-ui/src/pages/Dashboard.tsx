import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Activity,
  Shield,
  Search,
  FileCheck,
  Server,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react'
import { instanceApi, monitoringApi } from '@/lib/api'
// import { formatNumber } from '@/lib/utils'

export default function Dashboard() {
  const navigate = useNavigate()

  const { data: instances } = useQuery({
    queryKey: ['instances'],
    queryFn: instanceApi.list,
  })

  const { data: systemMetrics } = useQuery({
    queryKey: ['system-metrics'],
    queryFn: () => monitoringApi.getSystemMetrics('24h'),
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  const stats = [
    {
      name: 'Active Instances',
      value: Array.isArray(instances) ? instances?.filter((i) => i.status === 'running')?.length : 0,
      icon: Server,
      color: 'text-blue-600 bg-blue-50',
      trend: '+12%',
    },
    {
      name: 'PII Detected (24h)',
      value: systemMetrics?.pii_detected_24h || 0,
      icon: Search,
      color: 'text-purple-600 bg-purple-50',
      trend: '+8%',
    },
    {
      name: 'Data Protected (24h)',
      value: systemMetrics?.pii_anonymized_24h || 0,
      icon: Shield,
      color: 'text-green-600 bg-green-50',
      trend: '+15%',
    },
    {
      name: 'Compliance Score',
      value: '98.5%',
      icon: FileCheck,
      color: 'text-emerald-600 bg-emerald-50',
      trend: '+2%',
    },
  ]

  const recentActivity = [
    {
      id: 1,
      type: 'instance_created',
      message: 'New Presidio instance deployed in production',
      timestamp: '2 minutes ago',
      status: 'success',
    },
    {
      id: 2,
      type: 'pii_detected',
      message: '1,234 PII entities detected and anonymized',
      timestamp: '15 minutes ago',
      status: 'info',
    },
    {
      id: 3,
      type: 'compliance_report',
      message: 'Monthly compliance report generated',
      timestamp: '1 hour ago',
      status: 'success',
    },
    {
      id: 4,
      type: 'alert',
      message: 'High memory usage on analyzer-prod-2',
      timestamp: '2 hours ago',
      status: 'warning',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of your Sovereign Data Shield deployment
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="card p-5">
            <div className="flex items-center justify-between">
              <div className={`rounded-lg p-3 ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div className="flex items-center text-sm font-medium text-green-600">
                <TrendingUp className="h-4 w-4 mr-1" />
                {stat.trend}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-600">{stat.name}</p>
              <p className="mt-1 text-3xl font-semibold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* System Health */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">System Health</h2>
            <Activity className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium text-gray-700">Analyzer Services</span>
              </div>
              <span className="text-sm text-green-600 font-medium">Healthy</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium text-gray-700">Anonymizer Services</span>
              </div>
              <span className="text-sm text-green-600 font-medium">Healthy</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium text-gray-700">Database</span>
              </div>
              <span className="text-sm text-green-600 font-medium">Healthy</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <span className="text-sm font-medium text-gray-700">Storage</span>
              </div>
              <span className="text-sm text-yellow-600 font-medium">85% Used</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div
                  className={`mt-0.5 h-2 w-2 rounded-full ${
                    activity.status === 'success'
                      ? 'bg-green-500'
                      : activity.status === 'warning'
                      ? 'bg-yellow-500'
                      : 'bg-blue-500'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <button className="btn-primary py-3" onClick={() => navigate('/analyzer')}>
            <Search className="h-5 w-5 mr-2" />
            Analyze Text
          </button>
          <button className="btn-primary py-3">
            <Shield className="h-5 w-5 mr-2" />
            Anonymize Data
          </button>
          <button className="btn-secondary py-3">
            <Server className="h-5 w-5 mr-2" />
            Deploy Instance
          </button>
          <button className="btn-secondary py-3">
            <FileCheck className="h-5 w-5 mr-2" />
            View Reports
          </button>
        </div>
      </div>
    </div>
  )
}

// Made with Bob
