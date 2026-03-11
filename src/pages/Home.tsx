import { useState } from 'react';
import { useAppStore } from '../store';
import { isToday, isTomorrow, isValid } from 'date-fns';
import { Calendar, CheckSquare, Brain, ArrowRight, Plus, Bell, Check, X, Send, Loader2, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { safeFormat, safeFormatDate } from '../utils/date';
import { LinkifiedText } from '../components/LinkifiedText';
import { toast } from 'react-hot-toast';

export function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [commandText, setCommandText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const appointments = useAppStore((state) => state.appointments || []);
  const tasks = useAppStore((state) => state.tasks || []);
  const memories = useAppStore((state) => state.memories || []);
  const suggestions = useAppStore((state) => state.suggestions || []);

  const addAppointment = useAppStore((state) => state.addAppointment);
  const addTask = useAppStore((state) => state.addTask);
  const addMemory = useAppStore((state) => state.addMemory);

  const acceptSuggestion = useAppStore((state) => state.acceptSuggestion);
  const rejectSuggestion = useAppStore((state) => state.rejectSuggestion);

  const upcomingAppointments = [...(appointments || [])]
    .filter((a) => a && !a.isCompleted)
    .sort((a, b) => {
      if (!a?.date || !a?.time) return 1;
      if (!b?.date || !b?.time) return -1;
      try {
        const timeA = new Date(`${a.date}T${a.time}`).getTime();
        const timeB = new Date(`${b.date}T${b.time}`).getTime();
        if (isNaN(timeA)) return 1;
        if (isNaN(timeB)) return -1;
        return timeA - timeB;
      } catch {
        return 0;
      }
    })
    .slice(0, 4);

  const pendingTasks = (tasks || []).filter((t) => t && !t.isCompleted).slice(0, 4);
  const recentMemories = [...(memories || [])]
    .sort((a, b) => {
      if (!a?.createdAt) return 1;
      if (!b?.createdAt) return -1;
      try {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        if (isNaN(timeA)) return 1;
        if (isNaN(timeB)) return -1;
        return timeB - timeA;
      } catch {
        return 0;
      }
    })
    .slice(0, 4);

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandText.trim() || isProcessing) return;

    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!geminiKey) {
      toast.error('Chave do Gemini não configurada.');
      return;
    }

    setIsProcessing(true);
    try {
      const prompt = `Analise o pedido do usuário e responda APENAS com um JSON puro, sem blocos de código markdown.
      Data atual: ${new Date().toLocaleString('pt-BR')}.
      Pedido: "${commandText}"

      Regras:
      - Extraia links e detalhes extras para o campo "note" ou "content".
      - Compromisso: {"type": "appointment", "data": {"title": "...", "date": "YYYY-MM-DD", "time": "HH:mm", "address": "...", "note": "..."}}
      - Tarefa: {"type": "task", "data": {"title": "...", "note": "..."}}
      - Memória: {"type": "memory", "data": {"title": "...", "folder": "Geral", "content": "...", "type": "text/link"}}`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Erro na comunicação com a IA.');
      }

      const result = await response.json();
      if (!result.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('Resposta inválida da IA.');
      }

      const text = result.candidates[0].content.parts[0].text.trim();
      console.log('Gemini AI Response:', text);

      let cleanJson = text;
      // Robust JSON extraction even if AI includes markdown or extra text
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanJson = jsonMatch[0];
      }

      const parsed = JSON.parse(cleanJson);

      if (parsed.type === 'appointment' && parsed.data) {
        addAppointment(parsed.data);
        toast.success('Compromisso adicionado!');
      } else if (parsed.type === 'task' && parsed.data) {
        addTask({ ...parsed.data, type: 'standard' });
        toast.success('Tarefa adicionada!');
      } else if (parsed.type === 'memory' && parsed.data) {
        addMemory(parsed.data);
        toast.success('Memória salva!');
      } else {
        throw new Error('Formato de resposta inválido.');
      }

      setCommandText('');
      setIsModalOpen(false);
    } catch (error: any) {
      console.error('AI Error:', error);
      toast.error(error.message || 'Erro ao processar comando.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatApptDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
      if (dateStr.length === 10) { // YYYY-MM-DD
        const [y, m, d] = dateStr.split('-').map(Number);
        const date = new Date(y, m - 1, d);
        if (isValid(date)) {
          if (isToday(date)) return 'Hoje';
          if (isTomorrow(date)) return 'Amanhã';
        }
      }
      return safeFormat(dateStr, "dd/MM");
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Bom dia!
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Aqui está o que temos para hoje, {safeFormatDate(new Date(), "dd 'de' MMMM")}.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-indigo-500/20"
          >
            <Plus size={18} />
            Novo Item
          </button>
        </div>
      </header>

      {/* Command Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <MessageSquare size={20} />
                </div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Comando por Texto</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-zinc-500">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCommand} className="p-6 space-y-4">
              <textarea
                autoFocus
                value={commandText}
                onChange={(e) => setCommandText(e.target.value)}
                className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none h-32 text-zinc-900 dark:text-zinc-100"
                placeholder="Ex: Marcar médico amanhã às 15h"
              />
              <button
                type="submit"
                disabled={isProcessing || !commandText.trim()}
                className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <>Processar <Send size={18} /></>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Suggestions and Sharing Section */}
      {suggestions.length > 0 && (
        <section className="animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-2 mb-4 px-1">
            <Bell size={18} className="text-indigo-500" />
            <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">Sugestões e Compartilhamento</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestions.map((suggestion) => (
              <div key={suggestion.id} className="bg-white dark:bg-zinc-900 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl p-4 flex items-start justify-between gap-4 shadow-sm">
                <div className="flex gap-3">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl h-fit">
                    {suggestion.type === 'appointment' ? <Calendar size={20} /> : <CheckSquare size={20} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">{suggestion.title}</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{suggestion.description}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => rejectSuggestion(suggestion.id)}
                    className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 rounded-lg transition-colors"
                  >
                    <X size={18} />
                  </button>
                  <button 
                    onClick={() => acceptSuggestion(suggestion.id)}
                    className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-md shadow-indigo-500/20"
                  >
                    <Check size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Agenda Section */}
        <section className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                <Calendar size={20} />
              </div>
              <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">Agenda</h2>
            </div>
            <Link to="/agenda" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
              Ver tudo <ArrowRight size={12} />
            </Link>
          </div>
          
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex-1">
            {upcomingAppointments.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-zinc-500 dark:text-zinc-400 italic">Nenhum compromisso próximo.</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {upcomingAppointments.map((appt) => (
                  <div key={appt.id} className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {appt.title}
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-1">
                          <span className="font-medium text-indigo-500">{formatApptDate(appt.date)}</span>
                          <span className="text-zinc-300 dark:text-zinc-700">•</span>
                          <span>{appt.time}</span>
                        </p>
                        {appt.note && (
                          <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-2 italic line-clamp-2 bg-indigo-50/50 dark:bg-indigo-900/10 p-2 rounded-lg border border-indigo-100/50 dark:border-indigo-900/30">
                            <LinkifiedText text={appt.note} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Tasks Section */}
        <section className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                <CheckSquare size={20} />
              </div>
              <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">Tarefas</h2>
            </div>
            <Link to="/tasks" className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1">
              Ver tudo <ArrowRight size={12} />
            </Link>
          </div>
          
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex-1">
            {pendingTasks.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-zinc-500 dark:text-zinc-400 italic">Nenhuma tarefa pendente.</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {pendingTasks.map((task) => (
                  <div key={task.id} className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group flex items-center gap-3">
                    <div className="w-5 h-5 rounded-md border-2 border-zinc-200 dark:border-zinc-700 group-hover:border-emerald-500 transition-colors" />
                    <div>
                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {task.title}
                      </h3>
                      {task.note && (
                        <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 italic line-clamp-1 bg-emerald-50/50 dark:bg-emerald-900/10 p-1.5 rounded-lg border border-emerald-100/50 dark:border-emerald-900/30 w-fit">
                          <LinkifiedText text={task.note} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Memory Section */}
        <section className="flex flex-col h-full md:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
                <Brain size={20} />
              </div>
              <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">Memória</h2>
            </div>
            <Link to="/memory" className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1">
              Ver tudo <ArrowRight size={12} />
            </Link>
          </div>
          
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex-1">
            {recentMemories.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-zinc-500 dark:text-zinc-400 italic">Nenhuma memória salva.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 divide-y divide-zinc-100 dark:divide-zinc-800">
                {recentMemories.map((memory) => (
                  <div key={memory.id} className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-1">
                        {memory.title}
                      </h3>
                      <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-2 py-1 rounded-lg">
                        {memory.folder}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Quick Tips / Assistant Promo */}
      <div 
        className="bg-indigo-600 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-500/20"
      >
        <div className="relative z-10 max-w-lg">
          <h2 className="text-2xl font-bold mb-2">Dica do Assistente</h2>
          <p className="text-indigo-100 text-sm md:text-base leading-relaxed">
            Você sabia que pode dizer "Vincular tarefa X à agenda para amanhã às 10h"? 
            Eu cuido de tudo para você, mantendo suas tarefas e compromissos em sincronia.
          </p>
          <button className="mt-6 px-6 py-2.5 bg-white text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-colors">
            Experimentar agora
          </button>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
      </div>
    </div>
  );
}
