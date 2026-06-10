import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Search,
  Shield,
  FileStack,
  Server,
  Activity,
  FileCheck,
  Cloud,
  Settings,
  Users,
  Menu,
  X,
  ChevronDown,
  Database,
  Sliders,
  FileText,
  ClipboardCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface LayoutProps {
  children: React.ReactNode
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Data Discovery', href: '/discovery', icon: Database },
  { name: 'PII Analyzer', href: '/analyzer', icon: Search },
  { name: 'Anonymization Controls', href: '/anonymization-controls', icon: Sliders },
  { name: 'Audit Logs', href: '/audit-logs', icon: FileText },
  { name: 'Compliance Reports', href: '/compliance-reports', icon: ClipboardCheck },
  { name: 'Anonymizer', href: '/anonymizer', icon: Shield },
  { name: 'Batch Processing', href: '/batch', icon: FileStack },
  { name: 'Instances', href: '/instances', icon: Server },
  { name: 'Monitoring', href: '/monitoring', icon: Activity },
  { name: 'Compliance', href: '/compliance', icon: FileCheck },
  { name: 'Clusters', href: '/clusters', icon: Cloud },
  { name: 'Configuration', href: '/configuration', icon: Settings },
  { name: 'Users', href: '/users', icon: Users },
]

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-sovereign-600" />
            <div>
              <h1 className="text-lg font-bold text-gray-900">Sovereign</h1>
              <p className="text-xs text-gray-500">Data Shield</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-sovereign-50 text-sovereign-700'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon
                  className={cn(
                    'mr-3 h-5 w-5',
                    isActive ? 'text-sovereign-600' : 'text-gray-400'
                  )}
                />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-gray-200 p-4">
          <div className="text-xs text-gray-500">
            <p className="font-semibold">Sovereign Core</p>
            <p>Version 1.0.0</p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex h-16 bg-white border-b border-gray-200 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="px-4 text-gray-500 focus:outline-none lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex flex-1 justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex flex-1 items-center">
              <div className="w-full max-w-lg">
                <label htmlFor="search" className="sr-only">
                  Search
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="search"
                    name="search"
                    className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:border-sovereign-500 focus:outline-none focus:ring-1 focus:ring-sovereign-500"
                    placeholder="Search..."
                    type="search"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-600">All Systems Operational</span>
              </div>

              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <div className="h-8 w-8 rounded-full bg-sovereign-600 flex items-center justify-center text-white font-semibold">
                    A
                  </div>
                  <span>Admin</span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                    <div className="py-1">
                      <a
                        href="#"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Profile
                      </a>
                      <a
                        href="#"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Settings
                      </a>
                      <a
                        href="#"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Sign out
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <div className="py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
          </div>
        </main>
      </div>
    </div>
  )
}

// Made with Bob
