import { useState } from 'react';
import { useAppStore } from '../store';
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isToday, 
  addMonths, 
  subMonths, 
  isSameDay 
} from 'date-fns';
import { 
  Clock, 
  Bell, 
  Trash2, 
  CheckCircle, 
  Circle, 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  ChevronDown, 
  ChevronUp, 
  MapPin, 
  ExternalLink, 
  Plus, 
  Send, 
  X, 
  Layers 
} from 'lucide-react';
import { clsx } from 'clsx';
import { safeFormat, safeFormatDate } from '../utils/date';
import { LinkifiedText } from '../components/LinkifiedText';

export function Agenda() {
  const appointments = useAppStore((state) => state.appointments || []);
  const updateAppointment = useAppStore((state) => state.updateAppointment);
  const deleteAppointment = useAppStore((state) => state.deleteAppointment);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [newUpdateText, setNewUpdateText] = useState('');
  const [showAddSecondary, setShowAddSecondary] = useState(false);
  const [secondaryForm, setSecondaryForm] = useState({ title: '', date: '', time: '', reminderTime: 15 });

  const selectedAppt = (appointments || []).find(a => a.id === selectedAppointmentId);
  const secondaryAppts = (appointments || []).filter(a => a.parentId === selectedAppointmentId);

  const handleAddUpdate = (apptId: string) => {
    if (!newUpdateText.trim()) return;
    updateAppointment(apptId, { newUpdate: newUpdateText });
    setNewUpdateText('');
  };

  const handleAddSecondary = () => {
    if (!selectedAppointmentId || !secondaryForm.title || !secondaryForm.date || !secondaryForm.time) return;
    
    useAppStore.getState().addAppointment({
      ...secondaryForm,
      parentId: selectedAppointmentId
    });
    
    setSecondaryForm({ title: '', date: '', time: '', reminderTime: 15 });
    setShowAddSecondary(false);
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const hasAppointment = (date: Date) => {
    const dateStr = safeFormatDate(date, 'yyyy-MM-dd');
    return (appointments || []).some(a => a.date === dateStr && !a.isCompleted);
  };

  const filteredAppointments = ((selectedDate 
    ? (appointments || []).filter(a => a.date === safeFormatDate(selectedDate, 'yyyy-MM-dd'))
    : (appointments || []))).filter(a => !a.parentId);

  // Group by date
  const grouped = filteredAppointments.reduce((acc, appt) => {
    const dateKey = appt.date || 'undefined';
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(appt);
    return acc;
  }, {} as Record<string, typeof appointments>);

  const sortedDates = Object.keys(grouped).sort();

  const formatReminderTime = (minutes: number) => {
    if (!minutes) return '15 min';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const hourText = hours === 1 ? '1 hora' : `${hours} horas`;
    if (mins === 0) return hourText;
    return `${hourText} e ${mins} min`;
  };

  return (
    <div className="py-4 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Agenda</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Seus próximos compromissos.</p>
      </header>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden transition-colors">
        <button 
          onClick={() => setIsCalendarOpen(!isCalendarOpen)}
          className="w-full p-4 flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200 font-medium">
            <CalendarIcon size={20} className="text-indigo-600 dark:text-indigo-400" />
            <span>Calendário</span>
          </div>
          {isCalendarOpen ? <ChevronUp size={20} className="text-zinc-500" /> : <ChevronDown size={20} className="text-zinc-500" />}
        </button>

        {isCalendarOpen && (
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex justify-between items-center mb-4">
              <button onClick={prevMonth} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-600 dark:text-zinc-400">
                <ChevronLeft size={20} />
              </button>
              <h2 className="font-medium text-zinc-800 dark:text-zinc-200 capitalize">
                {safeFormatDate(currentDate, 'MMMM yyyy')}
              </h2>
              <button onClick={nextMonth} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-600 dark:text-zinc-400">
                <ChevronRight size={20} />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => <div key={i}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, i) => {
                const isCurrentMonth = isSameMonth(day, monthStart);
                const isDayToday = isToday(day);
                const hasAppt = hasAppointment(day);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                
                return (
                  <button 
                    key={i} 
                    onClick={() => {
                      if (isSelected) {
                        setSelectedDate(null); // toggle off
                      } else {
                        setSelectedDate(day);
                      }
                    }}
                    className="flex flex-col items-center justify-center h-10 relative hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <div className={clsx(
                      "w-7 h-7 flex items-center justify-center rounded-full text-sm",
                      !isCurrentMonth && "text-zinc-300 dark:text-zinc-700",
                      isCurrentMonth && !isDayToday && !isSelected && "text-zinc-700 dark:text-zinc-300",
                      isDayToday && !isSelected && "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold",
                      isSelected && "bg-indigo-600 text-white font-bold"
                    )}>
                      {safeFormatDate(day, 'd')}
                    </div>
                    {hasAppt && (
                      <div className={clsx("absolute bottom-1 w-1 h-1 rounded-full", isSelected ? "bg-white" : "bg-indigo-500 dark:bg-indigo-400")}></div>
                    )}
                  </button>
                );
              })}
            </div>
            {selectedDate && (
              <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  Mostrando: {safeFormatDate(selectedDate, "dd 'de' MMMM")}
                </span>
                <button 
                  onClick={() => setSelectedDate(null)}
                  className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
                >
                  Ver todos
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {sortedDates.length === 0 ? (
        <div className="text-center py-10 text-zinc-400 dark:text-zinc-600">
          <p>{selectedDate ? "Nenhum compromisso neste dia." : "Sua agenda está vazia."}</p>
          <p className="text-sm mt-2">Diga: "Marcar reunião amanhã às 14h"</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((date) => {
            const formattedDate = safeFormat(date, "EEEE, dd 'de' MMMM");
            const dayAppointments = grouped[date].sort((a, b) => (a.time || '').localeCompare(b.time || ''));

            return (
              <div key={date} className="space-y-3">
                <h2 className="text-sm font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wider sticky top-0 bg-zinc-50 dark:bg-zinc-950 py-2 z-10">
                  {formattedDate}
                </h2>
                <div className="space-y-3">
                  {dayAppointments.map((appt) => (
                    <div 
                      key={appt.id} 
                      onClick={() => setSelectedAppointmentId(appt.id)}
                      className={clsx(
                        "bg-white dark:bg-zinc-900 p-4 rounded-2xl border shadow-sm transition-all cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700",
                        appt.isCompleted 
                          ? "border-zinc-200 dark:border-zinc-800 opacity-60" 
                          : "border-indigo-100 dark:border-indigo-900/30"
                      )}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              updateAppointment(appt.id, { isCompleted: !appt.isCompleted });
                            }}
                          >
                            {appt.isCompleted ? (
                              <CheckCircle className="text-emerald-500 dark:text-emerald-400" size={24} />
                            ) : (
                              <Circle className="text-zinc-300 dark:text-zinc-700 hover:text-indigo-400" size={24} />
                            )}
                          </button>
                          <h3 className={clsx("font-medium text-lg", appt.isCompleted ? "line-through text-zinc-500 dark:text-zinc-500" : "text-zinc-900 dark:text-zinc-100")}>
                            {appt.title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 text-zinc-400 text-xs font-medium">
                            {appointments.filter(a => a.parentId === appt.id).length > 0 && (
                              <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-lg">
                                <Layers size={12} />
                                <span>{appointments.filter(a => a.parentId === appt.id).length}</span>
                              </div>
                            )}
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteAppointment(appt.id);
                            }} 
                            className="text-zinc-400 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 p-1.5"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="pl-9 space-y-2">
                        <div className="flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
                          <div className="flex items-center gap-1.5">
                            <Clock size={16} />
                            <span>{appt.time}</span>
                          </div>
                          {appt.address && (
                            <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                              <MapPin size={16} />
                              <span className="max-w-[150px] truncate">{appt.address}</span>
                            </div>
                          )}
                        </div>
                        {appt.note && (
                          <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-2 italic line-clamp-2 bg-indigo-50/50 dark:bg-indigo-900/10 p-2 rounded-lg border border-indigo-100/50 dark:border-indigo-900/30 w-fit max-w-full">
                            <LinkifiedText text={appt.note} />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {/* Appointment Detail Modal */}
      {selectedAppointmentId && selectedAppt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div
            className="bg-white dark:bg-zinc-900 w-full max-w-2xl max-h-[90vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col"
          >
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                    <CalendarIcon size={20} />
                  </div>
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Detalhes do Evento</h2>
                </div>
                <button 
                  onClick={() => setSelectedAppointmentId(null)}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-500 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Main Info */}
                <section className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{selectedAppt.title}</h1>
                      <div className="flex flex-wrap gap-4 mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                        <div className="flex items-center gap-1.5">
                          <CalendarIcon size={16} className="text-indigo-500" />
                          <span>{safeFormat(selectedAppt.date, "dd 'de' MMMM")}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock size={16} className="text-indigo-500" />
                          <span>{selectedAppt.time}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Bell size={16} className="text-indigo-500" />
                          <span>Lembrete: {formatReminderTime(selectedAppt.reminderTime || 0)} antes</span>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => updateAppointment(selectedAppt.id, { isCompleted: !selectedAppt.isCompleted })}
                      className={clsx(
                        "px-4 py-2 rounded-xl text-sm font-bold transition-all",
                        selectedAppt.isCompleted 
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" 
                          : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                      )}
                    >
                      {selectedAppt.isCompleted ? "Concluído" : "Marcar como Concluído"}
                    </button>
                  </div>

                  {selectedAppt.address && (
                    <a 
                      href={selectedAppt.wazeLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white dark:bg-zinc-800 rounded-lg text-indigo-600 dark:text-indigo-400 shadow-sm">
                          <MapPin size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Endereço</p>
                          <p className="text-zinc-800 dark:text-zinc-200 font-medium">{selectedAppt.address}</p>
                        </div>
                      </div>
                      <ExternalLink size={20} className="text-indigo-400 group-hover:translate-x-1 transition-transform" />
                    </a>
                  )}

                  {selectedAppt.note && (
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 rounded-2xl">
                      <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Observação Inicial</p>
                      <div className="text-zinc-700 dark:text-zinc-300">
                        <LinkifiedText text={selectedAppt.note} />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-[10px] uppercase tracking-wider font-bold text-zinc-400 dark:text-zinc-600 px-1">
                    <div>
                      <p>Criado em</p>
                      <p className="text-zinc-600 dark:text-zinc-400 mt-0.5">
                        {safeFormat(selectedAppt.createdAt, "dd/MM/yyyy HH:mm")}
                      </p>
                    </div>
                    <div>
                      <p>Última atualização</p>
                      <p className="text-zinc-600 dark:text-zinc-400 mt-0.5">
                        {safeFormat(selectedAppt.updatedAt, "dd/MM/yyyy HH:mm")}
                      </p>
                    </div>
                  </div>
                </section>

                {/* Secondary Events */}
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                      <Layers size={20} className="text-indigo-500" />
                      Eventos Secundários
                    </h3>
                    <button 
                      onClick={() => setShowAddSecondary(!showAddSecondary)}
                      className="text-sm font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline"
                    >
                      <Plus size={16} />
                      Adicionar
                    </button>
                  </div>

                  {showAddSecondary && (
                    <div 
                      className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl space-y-3"
                    >
                      <input 
                        type="text" 
                        placeholder="Título do evento secundário..."
                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        value={secondaryForm.title}
                        onChange={e => setSecondaryForm({...secondaryForm, title: e.target.value})}
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input 
                          type="date" 
                          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          value={secondaryForm.date}
                          onChange={e => setSecondaryForm({...secondaryForm, date: e.target.value})}
                        />
                        <input 
                          type="time" 
                          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          value={secondaryForm.time}
                          onChange={e => setSecondaryForm({...secondaryForm, time: e.target.value})}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => setShowAddSecondary(false)}
                          className="px-4 py-2 text-sm font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                        >
                          Cancelar
                        </button>
                        <button 
                          onClick={handleAddSecondary}
                          className="px-4 py-2 text-sm font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                        >
                          Salvar Sub-evento
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {secondaryAppts.length === 0 ? (
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 italic text-center py-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
                        Nenhum evento secundário vinculado.
                      </p>
                    ) : (
                      secondaryAppts.map(sub => (
                        <div key={sub.id} className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl shadow-sm">
                          <div className="flex items-center gap-3">
                            <button onClick={() => updateAppointment(sub.id, { isCompleted: !sub.isCompleted })}>
                              {sub.isCompleted ? <CheckCircle size={20} className="text-emerald-500" /> : <Circle size={20} className="text-zinc-300" />}
                            </button>
                            <div>
                              <p className={clsx("text-sm font-medium", sub.isCompleted ? "line-through text-zinc-400" : "text-zinc-800 dark:text-zinc-200")}>
                                {sub.title}
                              </p>
                                <p className="text-[10px] text-zinc-500">
                                  {safeFormat(sub.date, "dd/MM")} às {sub.time}
                                </p>
                            </div>
                          </div>
                          <button onClick={() => deleteAppointment(sub.id)} className="text-zinc-300 hover:text-red-500">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </section>

                {/* Updates / Timeline */}
                <section className="space-y-4">
                  <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                    <Send size={20} className="text-indigo-500" />
                    Histórico de Atualizações
                  </h3>
                  
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Adicionar nova atualização..."
                      className="flex-1 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      value={newUpdateText}
                      onChange={e => setNewUpdateText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddUpdate(selectedAppt.id)}
                    />
                    <button 
                      onClick={() => handleAddUpdate(selectedAppt.id)}
                      className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
                    >
                      <Send size={20} />
                    </button>
                  </div>

                  <div className="space-y-4 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-100 dark:before:bg-zinc-800">
                    {!selectedAppt.updates || selectedAppt.updates.length === 0 ? (
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 italic pl-8">Nenhuma atualização registrada.</p>
                    ) : (
                      selectedAppt.updates.slice().reverse().map((update) => (
                        <div key={update.id} className="relative pl-8">
                          <div className="absolute left-[14px] top-2 w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_0_4px_rgba(99,102,241,0.1)]" />
                          <div className="bg-zinc-50 dark:bg-zinc-800/30 p-3 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                            <p className="text-sm text-zinc-700 dark:text-zinc-300">{update.text}</p>
                            <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 mt-1 uppercase tracking-tighter">
                              {safeFormat(update.timestamp, "dd 'de' MMMM 'às' HH:mm")}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </div>
          </div>
        </div>
      )}
    </div>
  );
}
