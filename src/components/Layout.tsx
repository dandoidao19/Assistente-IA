import { ReactNode, useState, useEffect, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, Calendar, CheckSquare, Brain, Settings, Menu, X, Mic2, LogOut } from 'lucide-react';
import { useAppStore } from '../store';
import { supabase } from '../lib/supabase';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { to: "/", icon: Home, label: "Início" },
  { to: "/agenda", icon: Calendar, label: "Agenda" },
  { to: "/tasks", icon: CheckSquare, label: "Tarefas" },
  { to: "/memory", icon: Brain, label: "Memória" },
  { to: "/settings", icon: Settings, label: "Ajustes" },
];

export function Layout({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const mainRef = useRef<HTMLElement>(null);
  const user = useAppStore((state) => state.user);
  const signOut = useAppStore((state) => state.signOut);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    signOut();
    navigate('/login');
  };

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 transition-colors">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Mic2 size={24} />
          </div>
          <span className="font-bold text-xl tracking-tight">Assistente</span>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 shadow-sm" 
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
                )
              }
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800">
          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl">
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mb-1">Status do Sistema</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs font-semibold">Online</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="flex flex-col flex-1 min-w-0">
        <header className="md:hidden flex items-center justify-between h-16 px-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-40 transition-colors">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <Mic2 size={18} />
            </div>
            <span className="font-bold text-lg">Assistente</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>

        {/* Desktop Header */}
        <header className="hidden md:flex items-center justify-between h-16 px-8 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-40 transition-colors">
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
            {navItems.find(item => item.to === location.pathname)?.label || "Painel"}
          </h2>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 border-r border-zinc-200 dark:border-zinc-800 pr-6">
              <div className="text-right">
                <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100">{user?.email}</p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Plano Pro</p>
              </div>
              <div className="w-8 h-8 bg-zinc-200 dark:bg-zinc-800 rounded-full flex items-center justify-center text-xs font-bold text-zinc-500">
                {user?.email?.[0].toUpperCase()}
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 text-zinc-500 hover:text-red-500 transition-colors text-sm font-medium"
            >
              <LogOut size={18} />
              Sair
            </button>
          </div>
        </header>

        <main ref={mainRef} className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className="max-w-5xl mx-auto p-4 md:p-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-lg border-t border-zinc-200 dark:border-zinc-800 pb-safe z-40 transition-colors">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center w-full h-full space-y-1 text-[10px] font-bold uppercase tracking-wider transition-all duration-200",
                  isActive 
                    ? "text-indigo-600 dark:text-indigo-400" 
                    : "text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                )
              }
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Mobile Drawer Overlay */}
      {isSidebarOpen && (
        <>
          <div
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 md:hidden"
          />
          <aside
            className="fixed top-0 left-0 bottom-0 w-72 bg-white dark:bg-zinc-900 z-50 md:hidden shadow-2xl flex flex-col"
          >
            <div className="p-6 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                  <Mic2 size={18} />
                </div>
                <span className="font-bold text-lg">Assistente</span>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-zinc-500">
                <X size={24} />
              </button>
            </div>
            <nav className="flex-1 p-4 space-y-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsSidebarOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-4 py-4 rounded-2xl text-base font-medium transition-all",
                      isActive 
                        ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400" 
                        : "text-zinc-500 dark:text-zinc-400"
                    )
                  }
                >
                  <item.icon size={22} />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </aside>
        </>
      )}
    </div>
  );
}
