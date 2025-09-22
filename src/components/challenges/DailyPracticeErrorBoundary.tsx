import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  retryCount: number;
}

export class DailyPracticeErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      retryCount: 0
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('DailyPractice Error Boundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: undefined,
        retryCount: prevState.retryCount + 1
      }));
    }
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: undefined,
      retryCount: 0
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const canRetry = this.state.retryCount < this.maxRetries;

      return (
        <div className="mb-6">
          <div className="glassmorphic p-4 md:p-6 rounded-lg border border-destructive/20 bg-destructive/5">
            <div className="flex items-start gap-3">
              <AlertTriangle 
                className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" 
                aria-hidden="true"
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-destructive mb-1">
                  Practice Section Error
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Something went wrong with the daily practice section. 
                  {canRetry ? ' You can try again or refresh the page.' : ' Please refresh the page to try again.'}
                </p>
                {this.state.error && (
                  <details className="mb-3">
                    <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                      Technical Details
                    </summary>
                    <pre className="mt-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded overflow-auto">
                      {this.state.error.message}
                    </pre>
                  </details>
                )}
                <div className="flex gap-2">
                  {canRetry && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={this.handleRetry}
                      className="text-xs"
                    >
                      <RefreshCw className="mr-1 h-3 w-3" aria-hidden="true" />
                      Retry ({this.maxRetries - this.state.retryCount} left)
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={this.handleReset}
                    className="text-xs"
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default DailyPracticeErrorBoundary;
