import { useState } from 'react';
import { useAppStore, Task } from '../store';
import { CheckSquare, Square, Trash2, CalendarPlus, X, Clock, Calendar, Layers, Plus } from 'lucide-react';
import { clsx } from 'clsx';
import { toast } from 'react-hot-toast';
import { safeFormat } from '../utils/date';
import { LinkifiedText } from '../components/LinkifiedText';

export function Tasks() {
  const tasks = useAppStore((state) => state.tasks || []);
  const updateTask = useAppStore((state) => state.updateTask);
  const deleteTask = useAppStore((state) => state.deleteTask);
  const addTask = useAppStore((state) => state.addTask);
  const addAppointment = useAppStore((state) => state.addAppointment);
  const appointments = useAppStore((state) => state.appointments || []);

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [linkingTask, setLinkingTask] = useState<string | null>(null);
  const [linkDate, setLinkDate] = useState('');
  const [linkTime, setLinkTime] = useState('');
  const [showAddSubTask, setShowAddSubTask] = useState(false);
  const [subTaskTitle, setSubTaskTitle] = useState('');

  const selectedTask = (tasks || []).find(t => t.id === selectedTaskId);
  const linkedAppointment = selectedTask?.appointmentId ? (appointments || []).find(a => a.id === selectedTask.appointmentId) : null;
  const subTasks = (tasks || []).filter(t => t.parentId === selectedTaskId);

  const pendingTasks = (tasks || []).filter(t => !t.isCompleted && !t.parentId);
  const completedTasks = (tasks || []).filter(t => t.isCompleted && !t.parentId);

  const handleLinkAppointment = (taskId: string, title: string, note?: string) => {
    if (!linkDate || !linkTime) {
      toast.error('Preencha data e hora para vincular.');
      return;
    }
    
    const apptId = addAppointment({
      title: `Tarefa: ${title}`,
      date: linkDate,
      time: linkTime,
      note: note,
      reminderTime: 15,
      taskId: taskId,
    });
    
    updateTask(taskId, { appointmentId: apptId });
    toast.success('Compromisso vinculado à tarefa!');
    setLinkingTask(null);
    setLinkDate('');
    setLinkTime('');
  };

  const handleAddSubTask = () => {
    if (!selectedTaskId || !subTaskTitle.trim()) return;
    addTask({
      title: subTaskTitle,
      parentId: selectedTaskId,
      type: 'standard'
    });
    setSubTaskTitle('');
    setShowAddSubTask(false);
    toast.success('Sub-tarefa adicionada!');
  };

  return (
    <div className="py-4 space-y-6 pb-20">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Tarefas</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Sua lista de afazeres.</p>
      </header>

      {tasks.length === 0 ? (
        <div className="text-center py-10 text-zinc-400 dark:text-zinc-600">
          <p>Nenhuma tarefa pendente.</p>
          <p className="text-sm mt-2">Diga: "Adicionar à lista: comprar pão e leite"</p>
        </div>
      ) : (
        <div className="space-y-6">
          {pendingTasks.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Pendentes</h2>
              <div className="space-y-3">
                {pendingTasks.map((task) => (
                  <div 
                    key={task.id} 
                    className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col gap-3"
                  >
                    <div 
                      className="flex justify-between items-start cursor-pointer"
                      onClick={() => setSelectedTaskId(task.id)}
                    >
                      <div className="flex items-center gap-3">
                        <button onClick={(e) => {
                          e.stopPropagation();
                          updateTask(task.id, { isCompleted: true });
                        }}>
                          <Square className="text-zinc-300 dark:text-zinc-700 hover:text-emerald-500 dark:hover:text-emerald-400" size={24} />
                        </button>
                        <div>
                          <h3 className="font-medium text-zinc-900 dark:text-zinc-100">{task.title}</h3>
                          {task.deadline && (
                            <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-0.5">
                              <Clock size={10} />
                              Prazo: {task.deadline}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {(tasks || []).filter(t => t.parentId === task.id).length > 0 && (
                          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-lg text-[10px] font-bold text-zinc-500">
                            <Layers size={12} />
                            <span>{(tasks || []).filter(t => t.parentId === task.id).length}</span>
                          </div>
                        )}
                        <button onClick={(e) => {
                          e.stopPropagation();
                          deleteTask(task.id);
                        }} className="text-zinc-400 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    
                    {task.note && (
                      <div className="pl-9 text-[10px] text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800 line-clamp-2 italic">
                        <LinkifiedText text={task.note} />
                      </div>
                    )}

                    <div className="pl-9">
                      {linkingTask === task.id ? (
                        <div 
                          className="bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-2 mt-2"
                        >
                          <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Vincular a um compromisso</p>
                          <div className="flex gap-2">
                            <input 
                              type="date" 
                              className="text-sm p-1 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded w-full dark:text-zinc-200"
                              value={linkDate}
                              onChange={(e) => setLinkDate(e.target.value)}
                            />
                            <input 
                              type="time" 
                              className="text-sm p-1 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded w-full dark:text-zinc-200"
                              value={linkTime}
                              onChange={(e) => setLinkTime(e.target.value)}
                            />
                          </div>
                          <div className="flex gap-2 justify-end mt-2">
                            <button 
                              onClick={() => setLinkingTask(null)}
                              className="text-xs px-3 py-1 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded"
                            >
                              Cancelar
                            </button>
                            <button 
                              onClick={() => handleLinkAppointment(task.id, task.title, task.note)}
                              className="text-xs px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                            >
                              Salvar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setLinkingTask(task.id)}
                          className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-800 dark:hover:text-indigo-300"
                        >
                          <CalendarPlus size={14} />
                          Vincular à Agenda
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {completedTasks.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Concluídas</h2>
              <div className="space-y-3">
                {completedTasks.map((task) => (
                  <div 
                    key={task.id} 
                    className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 flex justify-between items-center opacity-60"
                  >
                    <div 
                      className="flex items-center gap-3 cursor-pointer"
                      onClick={() => setSelectedTaskId(task.id)}
                    >
                      <button onClick={(e) => {
                        e.stopPropagation();
                        updateTask(task.id, { isCompleted: false });
                      }}>
                        <CheckSquare className="text-emerald-600 dark:text-emerald-400" size={24} />
                      </button>
                      <h3 className="font-medium text-zinc-500 dark:text-zinc-400 line-through">{task.title}</h3>
                    </div>
                    <button onClick={() => deleteTask(task.id)} className="text-zinc-400 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {/* Task Detail Modal */}
      {selectedTaskId && selectedTask && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div
            className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                    <CheckSquare size={20} />
                  </div>
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Detalhes da Tarefa</h2>
                </div>
                <button 
                  onClick={() => setSelectedTaskId(null)}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-500 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto">
                <div>
                  <h1 className={clsx(
                    "text-2xl font-bold",
                    selectedTask.isCompleted ? "text-zinc-400 line-through" : "text-zinc-900 dark:text-zinc-100"
                  )}>
                    {selectedTask.title}
                  </h1>
                  {selectedTask.deadline && (
                    <p className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-1">
                      Prazo: {selectedTask.deadline}
                    </p>
                  )}
                  <button 
                    onClick={() => updateTask(selectedTask.id, { isCompleted: !selectedTask.isCompleted })}
                    className={clsx(
                      "mt-4 px-4 py-2 rounded-xl text-sm font-bold transition-all",
                      selectedTask.isCompleted 
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" 
                        : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                    )}
                  >
                    {selectedTask.isCompleted ? "Concluída" : "Marcar como Concluída"}
                  </button>
                </div>

                {selectedTask.note && (
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 rounded-2xl">
                    <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Observação</p>
                    <div className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                      <LinkifiedText text={selectedTask.note} />
                    </div>
                  </div>
                )}

                {/* Sub-tasks Section */}
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                      <Layers size={20} className="text-emerald-500" />
                      Sub-tarefas
                    </h3>
                    <button 
                      onClick={() => setShowAddSubTask(!showAddSubTask)}
                      className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:underline"
                    >
                      <Plus size={16} />
                      Adicionar
                    </button>
                  </div>

                  {showAddSubTask && (
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Título da sub-tarefa..."
                        className="flex-1 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        value={subTaskTitle}
                        onChange={e => setSubTaskTitle(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddSubTask()}
                      />
                      <button 
                        onClick={handleAddSubTask}
                        className="bg-emerald-600 text-white p-2 rounded-xl hover:bg-emerald-700 transition-colors"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                  )}

                  <div className="space-y-2">
                    {subTasks.length === 0 ? (
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 italic text-center py-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
                        Nenhuma sub-tarefa vinculada.
                      </p>
                    ) : (
                      subTasks.map(sub => (
                        <div key={sub.id} className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl shadow-sm">
                          <div className="flex items-center gap-3">
                            <button onClick={() => updateTask(sub.id, { isCompleted: !sub.isCompleted })}>
                              {sub.isCompleted ? <CheckSquare size={20} className="text-emerald-500" /> : <Square size={20} className="text-zinc-300" />}
                            </button>
                            <p className={clsx("text-sm font-medium", sub.isCompleted ? "line-through text-zinc-400" : "text-zinc-800 dark:text-zinc-200")}>
                              {sub.title}
                            </p>
                          </div>
                          <button onClick={() => deleteTask(sub.id)} className="text-zinc-300 hover:text-red-500">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </section>

                {linkedAppointment && (
                  <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl">
                    <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Calendar size={12} />
                      Compromisso Vinculado
                    </p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-zinc-800 dark:text-zinc-200 font-medium">{linkedAppointment.title}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-1">
                          <Clock size={12} />
                          {safeFormat(linkedAppointment.date, "dd/MM")} às {linkedAppointment.time}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
          </div>
        </div>
      )}
    </div>
  );
}
