/**
 * Error boundary component for catching and displaying React errors.
 *
 * Provides graceful error handling and fallback UI for unhandled errors.
 */
import { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card'

/**
 * Error boundary props.
 */
interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

/**
 * Error boundary state.
 */
interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

/**
 * Error boundary component for catching React errors.
 *
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 * ```
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  /**
   * Update state when error is caught.
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    }
  }

  /**
   * Log error details when error is caught.
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('Error boundary caught an error:', error)
      console.error('Error info:', errorInfo)
    }

    // Update state with error info
    this.setState({
      errorInfo,
    })

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // TODO: Log error to external service (Sentry, LogRocket, etc.)
    // logErrorToService(error, errorInfo)
  }

  /**
   * Reset error boundary state.
   */
  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  /**
   * Reload the page.
   */
  handleReload = (): void => {
    window.location.reload()
  }

  /**
   * Render fallback UI or children.
   */
  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state
    const { children, fallback } = this.props

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <CardTitle className="text-red-600">
                Oops! Something went wrong
              </CardTitle>
              <CardDescription>
                An unexpected error occurred. Please try refreshing the page or contact
                support if the problem persists.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {import.meta.env.DEV && error && (
                <div className="mt-4">
                  <details className="text-sm">
                    <summary className="cursor-pointer font-semibold text-gray-700 mb-2">
                      Error Details (Development Only)
                    </summary>
                    <div className="bg-gray-100 p-4 rounded-md overflow-auto">
                      <p className="font-mono text-red-600 mb-2">
                        {error.toString()}
                      </p>
                      {errorInfo && (
                        <pre className="font-mono text-xs text-gray-700 whitespace-pre-wrap">
                          {errorInfo.componentStack}
                        </pre>
                      )}
                    </div>
                  </details>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex gap-4">
              <Button onClick={this.handleReset} variant="default">
                Try Again
              </Button>
              <Button onClick={this.handleReload} variant="outline">
                Reload Page
              </Button>
              <Button
                onClick={() => (window.location.href = '/')}
                variant="ghost"
              >
                Go Home
              </Button>
            </CardFooter>
          </Card>
        </div>
      )
    }

    return children
  }
}

/**
 * Functional wrapper for error boundary with hooks support.
 *
 * @example
 * ```tsx
 * <ErrorBoundaryWrapper onError={(error) => logError(error)}>
 *   <MyComponent />
 * </ErrorBoundaryWrapper>
 * ```
 */
export function ErrorBoundaryWrapper({
  children,
  fallback,
  onError,
}: ErrorBoundaryProps): JSX.Element {
  return (
    <ErrorBoundary fallback={fallback} onError={onError}>
      {children}
    </ErrorBoundary>
  )
}

export default ErrorBoundary
