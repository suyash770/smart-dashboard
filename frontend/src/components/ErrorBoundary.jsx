import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-8">
                    <div className="max-w-2xl w-full bg-gray-800 p-6 rounded-lg shadow-xl border border-red-500/50">
                        <h1 className="text-2xl font-bold text-red-500 mb-4">Something went wrong.</h1>
                        <p className="mb-4 text-gray-300">The application crashed. Here is the error details:</p>
                        <pre className="bg-black/50 p-4 rounded text-sm text-red-300 overflow-auto mb-4">
                            {this.state.error && this.state.error.toString()}
                        </pre>
                        <details className="whitespace-pre-wrap text-xs text-gray-500">
                            {this.state.errorInfo && this.state.errorInfo.componentStack}
                        </details>
                        <button
                            onClick={() => window.location.href = '/'}
                            className="mt-6 px-4 py-2 bg-indigo-600 rounded hover:bg-indigo-500 transition-colors"
                        >
                            Go to Home
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
