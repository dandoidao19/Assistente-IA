import { Component, ReactNode } from 'react';

export class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen flex flex-col items-center justify-center p-4 text-center bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
          <h1 className="text-2xl font-bold mb-2">Ops! Algo deu errado.</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mb-6">Ocorreu um erro inesperado na interface.</p>
          <pre className="p-4 bg-zinc-100 dark:bg-zinc-900 rounded-lg text-xs overflow-auto max-w-full mb-6">
            {this.state.error?.message}
          </pre>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
          >
            Recarregar Aplicativo
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
