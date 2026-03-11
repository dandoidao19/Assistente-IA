import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { Mic2, Mail, Lock, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const setUser = useAppStore((state) => state.setUser);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast.success('Conta criada! Verifique seu email.');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setUser(data.user);
        navigate('/');
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro na autenticação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 mb-4">
            <Mic2 size={32} />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Assistente IA</h1>
            <span className="text-[10px] font-bold text-indigo-500 tracking-widest mt-2">v1.0</span>
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2">Seu companheiro inteligente para o dia a dia</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] shadow-xl border border-zinc-100 dark:border-zinc-800 transition-colors">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">
            {isSignUp ? 'Criar nova conta' : 'Entrar na sua conta'}
          </h2>

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2 text-left">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 ml-1">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input
                  type="email"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-zinc-100"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2 text-left">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 ml-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input
                  type="password"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-zinc-100"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 mt-6 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  {isSignUp ? 'Cadastrar' : 'Entrar'}
                  <span className="text-lg">→</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
            >
              {isSignUp ? 'Já tem uma conta? Entre aqui' : 'Não tem uma conta? Cadastre-se'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
