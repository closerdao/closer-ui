// write an ErrorBoundary component that will catch any errors that occur in the children of this component and display a message to the user. You can use the ErrorBoundary component in the App component to catch any errors that occur in the children of the App component.
import React, { PropsWithChildren } from 'react';

export default class ErrorBoundary extends React.Component<PropsWithChildren> {
  state = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error) {
    console.error(error);
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <>
          <h1>Something went wrong.</h1>;
        </>
      );
    }

    return this.props.children;
  }
}
