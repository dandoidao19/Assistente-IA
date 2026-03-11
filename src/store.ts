import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { User } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';

export type EventUpdate = {
  id: string;
  text: string;
  timestamp: string; // ISO string
};

export type Appointment = {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  address?: string;
  wazeLink?: string;
  note?: string;
  updates: EventUpdate[];
  createdAt: string;
  updatedAt: string;
  reminderTime?: number; // minutes before
  reminderDateTime?: string; // specific ISO string
  isCompleted: boolean;
  taskId?: string;
  parentId?: string; // ID of the "Matriz" appointment
};

export type Task = {
  id: string;
  title: string;
  note?: string;
  isCompleted: boolean;
  appointmentId?: string;
  parentId?: string; // ID of the parent task
  deadline?: string; // ISO string or description like "16:00"
  reminderTime?: number; // minutes before
  type: 'standard' | 'deadline';
};

export type Memory = {
  id: string;
  title: string;
  folder: string;
  content?: string;
  url?: string;
  imageUrl?: string;
  type: 'text' | 'link' | 'image' | 'video' | 'contact';
  createdAt: string; // ISO string
};

export type Settings = {
  reminderRingtone: string;
  appointmentRingtone: string;
  advanceNotificationTime: number; // default minutes
  voiceType: string;
  theme: 'light' | 'dark';
};

export type Suggestion = {
  id: string;
  type: 'appointment' | 'task';
  title: string;
  description: string;
  data: any; // The object to be created if accepted
  createdAt: string;
};

type AppState = {
  user: User | null;
  appointments: Appointment[];
  tasks: Task[];
  memories: Memory[];
  settings: Settings;
  suggestions: Suggestion[];
  loading: boolean;

  setUser: (user: User | null) => void;
  signOut: () => void;
  fetchData: () => Promise<void>;
  
  addAppointment: (appointment: Omit<Appointment, 'id' | 'isCompleted' | 'updates' | 'createdAt' | 'updatedAt' | 'wazeLink'>) => Promise<string>;
  updateAppointment: (id: string, appointment: Partial<Appointment> & { newUpdate?: string }) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
  
  addTask: (task: Omit<Task, 'id' | 'isCompleted'>) => Promise<string>;
  updateTask: (id: string, task: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  
  addMemory: (memory: Omit<Memory, 'id' | 'createdAt'>) => Promise<void>;
  updateMemory: (id: string, memory: Partial<Memory>) => Promise<void>;
  deleteMemory: (id: string) => Promise<void>;
  
  updateSettings: (settings: Partial<Settings>) => void;
  
  addSuggestion: (suggestion: Omit<Suggestion, 'id' | 'createdAt'>) => void;
  acceptSuggestion: (id: string) => void;
  rejectSuggestion: (id: string) => void;
  
  // Helper to get sub-items
  getSubAppointments: (parentId: string) => Appointment[];
  getSubTasks: (parentId: string) => Task[];
};

export const useAppStore = create<AppState>()(
  persist(
    (set, _get) => ({
      user: null as User | null,
      appointments: [] as Appointment[],
      tasks: [] as Task[],
      memories: [] as Memory[],
      suggestions: [] as Suggestion[],
      loading: false,
      settings: {
        reminderRingtone: 'default',
        appointmentRingtone: 'default',
        advanceNotificationTime: 15,
        voiceType: 'voice1',
        theme: 'light' as 'light' | 'dark',
      },

      setUser: (user) => {
        set({ user });
        if (user) {
          _get().fetchData();
        }
      },
      signOut: () => set({ user: null, appointments: [], tasks: [], memories: [], suggestions: [] }),

      fetchData: async () => {
        const { user } = _get();
        if (!user) return;

        set({ loading: true });
        try {
          const [apptsRes, tasksRes, memoriesRes] = await Promise.all([
            supabase.from('appointments').select('*').eq('user_id', user.id),
            supabase.from('tasks').select('*').eq('user_id', user.id),
            supabase.from('memories').select('*').eq('user_id', user.id)
          ]);

          if (apptsRes.data) {
            set({ appointments: apptsRes.data.map(a => ({
              id: a.id,
              title: a.title,
              date: a.date,
              time: a.time,
              address: a.address,
              wazeLink: a.waze_link,
              note: a.note,
              updates: a.updates || [],
              reminderTime: a.reminder_time,
              isCompleted: a.is_completed,
              taskId: a.task_id,
              parentId: a.parent_id,
              createdAt: a.created_at,
              updatedAt: a.updated_at
            })) });
          }

          if (tasksRes.data) {
            set({ tasks: tasksRes.data.map(t => ({
              id: t.id,
              title: t.title,
              note: t.note,
              isCompleted: t.is_completed,
              appointmentId: t.appointment_id,
              parentId: t.parent_id,
              deadline: t.deadline,
              reminderTime: t.reminder_time,
              type: t.type
            })) });
          }

          if (memoriesRes.data) {
            set({ memories: memoriesRes.data.map(m => ({
              id: m.id,
              title: m.title,
              folder: m.folder,
              content: m.content,
              url: m.url,
              imageUrl: m.image_url,
              type: m.type,
              createdAt: m.created_at
            })) });
          }
        } finally {
          set({ loading: false });
        }
      },

      addAppointment: async (appointment) => {
        const id = uuidv4();
        const now = new Date().toISOString();
        let wazeLink = undefined;
        if (appointment.address) {
          wazeLink = `https://waze.com/ul?q=${encodeURIComponent(appointment.address)}`;
        }
        
        const newAppt: Appointment = {
          ...appointment,
          id,
          isCompleted: false,
          updates: [],
          createdAt: now,
          updatedAt: now,
          wazeLink
        };

        set((state) => ({ appointments: [...state.appointments, newAppt] }));

        const { user } = _get();
        if (user) {
          await supabase.from('appointments').insert({
            id,
            user_id: user.id,
            title: appointment.title,
            date: appointment.date,
            time: appointment.time,
            address: appointment.address,
            waze_link: wazeLink,
            note: appointment.note,
            updates: [],
            reminder_time: appointment.reminderTime,
            is_completed: false,
            task_id: appointment.taskId,
            parent_id: appointment.parentId,
            created_at: now,
            updated_at: now
          });
        }

        return id;
      },
      updateAppointment: async (id, updated) => {
        const appt = _get().appointments.find(a => a.id === id);
        if (!appt) return;

        const now = new Date().toISOString();
        const { newUpdate, ...rest } = updated;
        
        const updates = appt.updates ? [...appt.updates] : [];
        if (newUpdate) {
          updates.push({
            id: uuidv4(),
            text: newUpdate,
            timestamp: now
          });
        }

        let wazeLink = appt.wazeLink;
        if (rest.address && rest.address !== appt.address) {
          wazeLink = `https://waze.com/ul?q=${encodeURIComponent(rest.address)}`;
        }

        const newAppointments = _get().appointments.map((a) =>
          a.id === id ? { ...a, ...rest, updates, updatedAt: now, wazeLink } : a
        );
        
        let newTasks = _get().tasks;
        if (appt.taskId && updated.isCompleted !== undefined) {
          newTasks = _get().tasks.map(t => t.id === appt.taskId ? { ...t, isCompleted: updated.isCompleted! } : t);
          const { user } = _get();
          if (user) {
            await supabase.from('tasks').update({ is_completed: updated.isCompleted }).eq('id', appt.taskId);
          }
        }

        set({ appointments: newAppointments, tasks: newTasks });

        const { user } = _get();
        if (user) {
          await supabase.from('appointments').update({
            title: rest.title,
            date: rest.date,
            time: rest.time,
            address: rest.address,
            waze_link: wazeLink,
            note: rest.note,
            updates,
            reminder_time: rest.reminderTime,
            is_completed: rest.isCompleted,
            task_id: rest.taskId,
            parent_id: rest.parentId,
            updated_at: now
          }).eq('id', id);
        }
      },
      deleteAppointment: async (id) => {
        set((state) => ({
          appointments: state.appointments.filter((a) => a.id !== id)
        }));

        const { user } = _get();
        if (user) {
          await supabase.from('appointments').delete().eq('id', id);
        }
      },

      addTask: async (task) => {
        const id = uuidv4();
        const newTask: Task = { ...task, id, isCompleted: false };
        set((state) => ({
          tasks: [...state.tasks, newTask]
        }));

        const { user } = _get();
        if (user) {
          await supabase.from('tasks').insert({
            id,
            user_id: user.id,
            title: task.title,
            note: task.note,
            is_completed: false,
            appointment_id: task.appointmentId,
            parent_id: task.parentId,
            deadline: task.deadline,
            reminder_time: task.reminderTime,
            type: task.type
          });
        }

        return id;
      },
      updateTask: async (id, updated) => {
        const task = _get().tasks.find(t => t.id === id);
        const newTasks = _get().tasks.map((t) => t.id === id ? { ...t, ...updated } : t);
        let newAppointments = _get().appointments;

        if (task && task.appointmentId && updated.isCompleted !== undefined) {
          newAppointments = _get().appointments.map(a => a.id === task.appointmentId ? { ...a, isCompleted: updated.isCompleted! } : a);
          const { user } = _get();
          if (user) {
            await supabase.from('appointments').update({ is_completed: updated.isCompleted }).eq('id', task.appointmentId);
          }
        }

        set({ tasks: newTasks, appointments: newAppointments });

        const { user } = _get();
        if (user) {
          await supabase.from('tasks').update({
            title: updated.title,
            note: updated.note,
            is_completed: updated.isCompleted,
            appointment_id: updated.appointmentId,
            parent_id: updated.parentId,
            deadline: updated.deadline,
            reminder_time: updated.reminderTime,
            type: updated.type
          }).eq('id', id);
        }
      },
      deleteTask: async (id) => {
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id)
        }));

        const { user } = _get();
        if (user) {
          await supabase.from('tasks').delete().eq('id', id);
        }
      },

      addMemory: async (memory) => {
        const id = uuidv4();
        const createdAt = new Date().toISOString();
        const newMemory: Memory = { ...memory, id, createdAt };
        set((state) => ({
          memories: [...state.memories, newMemory]
        }));

        const { user } = _get();
        if (user) {
          await supabase.from('memories').insert({
            id,
            user_id: user.id,
            title: memory.title,
            folder: memory.folder,
            content: memory.content,
            url: memory.url,
            image_url: memory.imageUrl,
            type: memory.type,
            created_at: createdAt
          });
        }
      },
      updateMemory: async (id, updated) => {
        set((state) => ({
          memories: state.memories.map((m) => m.id === id ? { ...m, ...updated } : m)
        }));

        const { user } = _get();
        if (user) {
          await supabase.from('memories').update({
            title: updated.title,
            folder: updated.folder,
            content: updated.content,
            url: updated.url,
            image_url: updated.imageUrl,
            type: updated.type
          }).eq('id', id);
        }
      },
      deleteMemory: async (id) => {
        set((state) => ({
          memories: state.memories.filter((m) => m.id !== id)
        }));

        const { user } = _get();
        if (user) {
          await supabase.from('memories').delete().eq('id', id);
        }
      },

      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
      })),

      addSuggestion: (suggestion) => set((state) => ({
        suggestions: [...state.suggestions, { ...suggestion, id: uuidv4(), createdAt: new Date().toISOString() }]
      })),

      acceptSuggestion: (id) => set((state) => {
        const suggestion = state.suggestions.find(s => s.id === id);
        if (!suggestion) return state;

        if (suggestion.type === 'appointment') {
          // Logic to add appointment would go here, but for simplicity we'll just remove it
          // In a real app, we'd call addAppointment with suggestion.data
        }

        return {
          suggestions: state.suggestions.filter(s => s.id !== id)
        };
      }),

      rejectSuggestion: (id) => set((state) => ({
        suggestions: state.suggestions.filter(s => s.id !== id)
      })),

      getSubAppointments: (parentId: string) => {
        return _get().appointments.filter((a: Appointment) => a.parentId === parentId);
      },

      getSubTasks: (parentId: string) => {
        return _get().tasks.filter((t: Task) => t.parentId === parentId);
      },
    }),
    {
      name: 'assistant-pessoal-v3',
    }
  )
);
