import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[Application Recovery] Uncaught UI error intercepted:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center p-6 text-center">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-md shadow-2xl text-white">
            <div className="w-12 h-12 rounded-full bg-amber-950/80 border border-amber-800 text-amber-400 mx-auto flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold mb-2">Display Recovery Activated</h2>
            <p className="text-sm text-gray-400 mb-6">
              A chart render notice was recovered. Click below to refresh the geospatial telemetry.
            </p>
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Telemetry
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
