import React from "react"

type AppErrorBoundaryProps = { children: React.ReactNode; fallback?: React.ReactNode }
type AppErrorBoundaryState = { hasError: boolean; message: string }

export class AppErrorBoundary extends React.Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  override state: AppErrorBoundaryState = { hasError: false, message: "" }

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[AppErrorBoundary]", error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="glass-card-dark p-8 m-8 text-center">
          <h2 className="text-lg font-semibold text-rose-400 mb-2">Something went wrong</h2>
          <p className="text-sm text-slate-400 mb-4">{this.state.message}</p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, message: "" })}
            className="bg-brand-primary text-white px-4 py-2 rounded-xl text-sm font-bold cursor-pointer"
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
