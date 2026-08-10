import React, { Component, ErrorInfo, PropsWithChildren } from 'react';

import { Button, ErrorMessage, Heading } from '../ui';

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<PropsWithChildren, State> {
  state: State = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div className="min-h-[40vh] flex flex-col items-center justify-center p-8 max-w-lg mx-auto">
          <Heading level={1} className="text-2xl mb-4">
            Something went wrong
          </Heading>
          <ErrorMessage error={this.state.error} />
          <Button
            color="accent"
            onClick={this.handleRetry}
            className="mt-4"
          >
            Try again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
