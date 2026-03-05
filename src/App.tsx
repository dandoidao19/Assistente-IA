import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect, Component, ReactNode } from 'react';
import { useAppStore } from './store';
import { Layout } from './components/Layout';
import { AssistantFAB } from './components/AssistantFAB';
import { Home } from './pages/Home';
import { Agenda } from './pages/Agenda';
import { Tasks } from './pages/Tasks';
import { Memory } from './pages/Memory';
import { Settings } from './pages/Settings';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen flex flex-col items-center justify-center p-4 text-center bg-zinc-50 dark:bg-zinc-950">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Ops! Algo deu errado.</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mb-6">Ocorreu um erro inesperado na interface.</p>
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

export default function App() {
  const theme = useAppStore((state) => state.settings?.theme || 'light');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/agenda" element={<Agenda />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/memory" element={<Memory />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </Layout>
        <AssistantFAB />
        <Toaster position="top-center" />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
