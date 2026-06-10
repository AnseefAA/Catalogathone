import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(d)
}

export function downloadFile(data: Blob, filename: string): void {
  const url = window.URL.createObjectURL(data)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text)
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    running: 'text-green-600 bg-green-50',
    healthy: 'text-green-600 bg-green-50',
    connected: 'text-green-600 bg-green-50',
    success: 'text-green-600 bg-green-50',
    completed: 'text-green-600 bg-green-50',
    pending: 'text-yellow-600 bg-yellow-50',
    processing: 'text-blue-600 bg-blue-50',
    stopped: 'text-gray-600 bg-gray-50',
    disconnected: 'text-gray-600 bg-gray-50',
    failed: 'text-red-600 bg-red-50',
    error: 'text-red-600 bg-red-50',
  }
  return colors[status.toLowerCase()] || 'text-gray-600 bg-gray-50'
}

export function getSeverityColor(severity: string): string {
  const colors: Record<string, string> = {
    low: 'text-blue-600 bg-blue-50',
    medium: 'text-yellow-600 bg-yellow-50',
    high: 'text-orange-600 bg-orange-50',
    critical: 'text-red-600 bg-red-50',
  }
  return colors[severity.toLowerCase()] || 'text-gray-600 bg-gray-50'
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = window.setTimeout(() => func(...args), wait)
  }
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export function parseEntityType(entityType: string): string {
  return entityType
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

export function getEntityTypeColor(entityType: string): string {
  const colors: Record<string, string> = {
    PERSON: 'bg-purple-100 text-purple-800',
    EMAIL_ADDRESS: 'bg-blue-100 text-blue-800',
    PHONE_NUMBER: 'bg-green-100 text-green-800',
    CREDIT_CARD: 'bg-red-100 text-red-800',
    SSN: 'bg-orange-100 text-orange-800',
    IBAN_CODE: 'bg-indigo-100 text-indigo-800',
    IP_ADDRESS: 'bg-cyan-100 text-cyan-800',
    LOCATION: 'bg-teal-100 text-teal-800',
    DATE_TIME: 'bg-pink-100 text-pink-800',
    URL: 'bg-violet-100 text-violet-800',
  }
  return colors[entityType] || 'bg-gray-100 text-gray-800'
}

// Made with Bob
