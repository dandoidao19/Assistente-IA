import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { useAppStore } from './store';
import { supabase } from './lib/supabase';
import { Layout } from './components/Layout';
import { AssistantFAB } from './components/AssistantFAB';
import { Home } from './pages/Home';
import { Agenda } from './pages/Agenda';
import { Tasks } from './pages/Tasks';
import { Memory } from './pages/Memory';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  const theme = useAppStore((state) => state.settings?.theme || 'light');
  const setUser = useAppStore((state) => state.setUser);
  const user = useAppStore((state) => state.user);
  const fetchData = useAppStore((state) => state.fetchData);

  useEffect(() => {
    // Escuta mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [setUser]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

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
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
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
              </ProtectedRoute>
            }
          />
        </Routes>
        <Toaster position="top-center" />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
