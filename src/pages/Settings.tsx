import { useAppStore } from '../store';
import { Bell, Clock, Mic2, Moon, Sun } from 'lucide-react';

export function Settings() {
  const settings = useAppStore((state) => state.settings || {
    reminderRingtone: 'default',
    appointmentRingtone: 'default',
    advanceNotificationTime: 15,
    voiceType: 'voice1',
    theme: 'light',
  });
  const updateSettings = useAppStore((state) => state.updateSettings);

  return (
    <div className="py-4 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Configurações</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Ajuste as preferências do assistente.</p>
      </header>

      <div className="space-y-4">
        <section className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-2">
            {settings?.theme === 'dark' ? (
              <Moon className="text-indigo-400" size={20} />
            ) : (
              <Sun className="text-amber-500" size={20} />
            )}
            <h2 className="font-medium text-zinc-800 dark:text-zinc-200">Tema</h2>
          </div>
          
          <div className="flex gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
            <button
              onClick={() => updateSettings({ theme: 'light' })}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
                settings?.theme === 'light' 
                  ? 'bg-white text-zinc-900 shadow-sm' 
                  : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              <Sun size={16} />
              Claro
            </button>
            <button
              onClick={() => updateSettings({ theme: 'dark' })}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
                settings?.theme === 'dark' 
                  ? 'bg-zinc-700 text-white shadow-sm' 
                  : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              <Moon size={16} />
              Escuro
            </button>
          </div>
        </section>

        <section className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="text-indigo-600 dark:text-indigo-400" size={20} />
            <h2 className="font-medium text-zinc-800 dark:text-zinc-200">Notificações</h2>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">Toque para Lembretes</label>
              <select 
                value={settings?.reminderRingtone || 'default'}
                onChange={(e) => updateSettings({ reminderRingtone: e.target.value })}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-sm outline-none focus:border-indigo-500 dark:text-zinc-200"
              >
                <option value="default">Padrão</option>
                <option value="chime">Sino</option>
                <option value="beep">Bipe</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">Toque para Compromissos</label>
              <select 
                value={settings?.appointmentRingtone || 'default'}
                onChange={(e) => updateSettings({ appointmentRingtone: e.target.value })}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-sm outline-none focus:border-indigo-500 dark:text-zinc-200"
              >
                <option value="default">Padrão</option>
                <option value="alert">Alerta</option>
                <option value="gentle">Suave</option>
              </select>
            </div>
          </div>
        </section>

        <section className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="text-indigo-600 dark:text-indigo-400" size={20} />
            <h2 className="font-medium text-zinc-800 dark:text-zinc-200">Tempo Padrão</h2>
          </div>
          
          <div>
            <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">Notificação Antecipada (minutos)</label>
            <input 
              type="number" 
              value={settings?.advanceNotificationTime || 15}
              onChange={(e) => updateSettings({ advanceNotificationTime: parseInt(e.target.value) || 15 })}
              className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-sm outline-none focus:border-indigo-500 dark:text-zinc-200"
            />
          </div>
        </section>

        <section className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Mic2 className="text-indigo-600 dark:text-indigo-400" size={20} />
            <h2 className="font-medium text-zinc-800 dark:text-zinc-200">Voz do Assistente</h2>
          </div>
          
          <div>
            <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1">Tipo de Voz</label>
            <select 
              value={settings?.voiceType || 'voice1'}
              onChange={(e) => updateSettings({ voiceType: e.target.value })}
              className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-sm outline-none focus:border-indigo-500 dark:text-zinc-200"
            >
              <option value="voice1">Voz 1 (Feminina Suave)</option>
              <option value="voice2">Voz 2 (Masculina Firme)</option>
              <option value="voice3">Voz 3 (Neutra)</option>
            </select>
          </div>
        </section>
      </div>
    </div>
  );
}
