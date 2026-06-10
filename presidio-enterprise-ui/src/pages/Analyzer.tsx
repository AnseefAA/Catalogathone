import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Search, Upload, Copy, AlertCircle } from 'lucide-react'
import { analyzerApi } from '@/lib/api'
import { getEntityTypeColor, parseEntityType, copyToClipboard } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { AnalyzerResult } from '@/types'

export default function Analyzer() {
  const [text, setText] = useState('')
  const [language, setLanguage] = useState('en')
  const [scoreThreshold, setScoreThreshold] = useState(0.5)
  const [results, setResults] = useState<AnalyzerResult[]>([])

  const analyzeMutation = useMutation({
    mutationFn: () => analyzerApi.analyze(text, language, scoreThreshold),
    onSuccess: (data) => {
      setResults(data)
      toast.success(`Found ${data.length} PII entities`)
    },
    onError: () => {
      toast.error('Failed to analyze text')
    },
  })

  const handleAnalyze = () => {
    if (!text.trim()) {
      toast.error('Please enter text to analyze')
      return
    }
    analyzeMutation.mutate()
  }

  const handleCopyResults = () => {
    copyToClipboard(JSON.stringify(results, null, 2))
    toast.success('Results copied to clipboard')
  }

  const highlightedText = () => {
    if (results.length === 0) return text

    const sortedResults = [...results].sort((a, b) => a.start - b.start)
    let highlighted = ''
    let lastIndex = 0

    sortedResults.forEach((result) => {
      highlighted += text.substring(lastIndex, result.start)
      highlighted += `<mark class="${getEntityTypeColor(result.entity_type)} px-1 rounded">${text.substring(result.start, result.end)}</mark>`
      lastIndex = result.end
    })
    highlighted += text.substring(lastIndex)

    return highlighted
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">PII Analyzer</h1>
        <p className="mt-1 text-sm text-gray-500">
          Detect sensitive information in text using NLP and pattern recognition
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-6">
            <label className="label mb-2">Text to Analyze</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="input min-h-[300px] font-mono text-sm"
              placeholder="Enter or paste text here..."
            />
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button className="btn-primary" onClick={handleAnalyze} disabled={analyzeMutation.isPending}>
                  <Search className="h-4 w-4 mr-2" />
                  {analyzeMutation.isPending ? 'Analyzing...' : 'Analyze Text'}
                </button>
                <button className="btn-secondary">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload File
                </button>
              </div>
              <span className="text-sm text-gray-500">{text.length} characters</span>
            </div>
          </div>

          {results.length > 0 && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Highlighted Results</h3>
                <button onClick={handleCopyResults} className="btn-secondary text-sm">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Results
                </button>
              </div>
              <div
                className="p-4 bg-gray-50 rounded-lg font-mono text-sm whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: highlightedText() }}
              />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Configuration</h3>
            <div className="space-y-4">
              <div>
                <label className="label mb-2">Language</label>
                <select value={language} onChange={(e) => setLanguage(e.target.value)} className="input">
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="it">Italian</option>
                  <option value="pt">Portuguese</option>
                </select>
              </div>
              <div>
                <label className="label mb-2">Confidence Threshold: {scoreThreshold}</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={scoreThreshold}
                  onChange={(e) => setScoreThreshold(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Detected Entities ({results.length})</h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {results.map((result, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-medium px-2 py-1 rounded ${getEntityTypeColor(result.entity_type)}`}>
                      {parseEntityType(result.entity_type)}
                    </span>
                    <span className="text-xs text-gray-500">{(result.score * 100).toFixed(0)}%</span>
                  </div>
                  <p className="text-sm font-mono text-gray-700 mt-2">
                    {text.substring(result.start, result.end)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Position: {result.start}-{result.end}
                  </p>
                </div>
              ))}
              {results.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>No entities detected</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
