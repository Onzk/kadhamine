import React from 'react';

import { BootErrorFallback } from '@/components/errors/BootErrorFallback';
import {
  ThemedErrorFallback,
  type ErrorFallbackProps,
} from '@/components/errors/ThemedErrorFallback';
import { reportError } from '@/lib/reportError';

type Props = {
  children: React.ReactNode;
  fallback?: (props: ErrorFallbackProps) => React.ReactNode;
  onError?: (error: Error, info: React.ErrorInfo) => void;
  /** Si true, n’utilise pas le thème (providers peut-être morts). */
  bootSafe?: boolean;
};

type State = {
  error: Error | null;
};

/**
 * Boundary React générique — capture les erreurs de rendu pour éviter un écran blanc.
 */
export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    reportError(error, { context: 'AppErrorBoundary', severity: 'error' });
    if (__DEV__) {
      console.error('[AppErrorBoundary] componentStack', info.componentStack);
    }
    this.props.onError?.(error, info);
  }

  private reset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (error) {
      const props: ErrorFallbackProps = { error, reset: this.reset };
      if (this.props.fallback) return this.props.fallback(props);
      if (this.props.bootSafe) {
        return <BootErrorFallback error={error} onRetry={this.reset} />;
      }
      return <ThemedErrorFallback {...props} />;
    }
    return this.props.children;
  }
}
