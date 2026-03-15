import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from './lib/supabase';
import { User } from '@supabase/supabase-js';

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
  setUser: (user: User | null) => void;
  appointments: Appointment[];
  tasks: Task[];
  memories: Memory[];
  settings: Settings;
  suggestions: Suggestion[];

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
    (set, get) => ({
      user: null,
      setUser: (user) => set({ user }),
      appointments: [],
      tasks: [],
      memories: [],
      suggestions: [],
      settings: {
        reminderRingtone: 'default',
        appointmentRingtone: 'default',
        advanceNotificationTime: 15,
        voiceType: 'voice1',
        theme: 'light',
      },

      fetchData: async () => {
        const { user } = get();
        if (!user) return;

        const [appts, tks, mems] = await Promise.all([
          supabase.from('appointments').select('*').order('date', { ascending: true }),
          supabase.from('tasks').select('*').order('created_at', { ascending: false }),
          supabase.from('memories').select('*').order('created_at', { ascending: false }),
        ]);

        set({
          appointments: (appts.data || []).map(a => ({
            ...a,
            wazeLink: a.waze_link,
            taskId: a.task_id,
            parentId: a.parent_id,
            isCompleted: a.is_completed,
            createdAt: a.created_at,
            updatedAt: a.updated_at
          })),
          tasks: (tks.data || []).map(t => ({
            ...t,
            appointmentId: t.appointment_id,
            parentId: t.parent_id,
            isCompleted: t.is_completed
          })),
          memories: (mems.data || []).map(m => ({
            ...m,
            imageUrl: m.image_url,
            createdAt: m.created_at
          }))
        });
      },

      addAppointment: async (appointment) => {
        const { user } = get();
        const id = uuidv4();
        const now = new Date().toISOString();
        let wazeLink = undefined;
        if (appointment.address) {
          wazeLink = `https://waze.com/ul?q=${encodeURIComponent(appointment.address)}`;
        }

        const newAppt = {
          ...appointment,
          id,
          is_completed: false,
          updates: [],
          created_at: now,
          updated_at: now,
          waze_link: wazeLink,
          user_id: user?.id,
          task_id: appointment.taskId,
          parent_id: appointment.parentId
        };

        const { error } = await supabase.from('appointments').insert([newAppt]);
        if (error) console.error('Error adding appointment:', error);

        get().fetchData();
        return id;
      },
      updateAppointment: async (id, updated) => {
        const appt = get().appointments.find(a => a.id === id);
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

        const dbUpdate: any = {
          ...rest,
          updates,
          updated_at: now,
          waze_link: wazeLink,
          is_completed: rest.isCompleted,
          task_id: rest.taskId,
          parent_id: rest.parentId
        };
        
        delete dbUpdate.isCompleted;
        delete dbUpdate.taskId;
        delete dbUpdate.parentId;

        const { error } = await supabase.from('appointments').update(dbUpdate).eq('id', id);
        if (error) console.error('Error updating appointment:', error);

        if (appt.taskId && updated.isCompleted !== undefined) {
          await supabase.from('tasks').update({ is_completed: updated.isCompleted }).eq('id', appt.taskId);
        }

        get().fetchData();
      },
      deleteAppointment: async (id) => {
        const { error } = await supabase.from('appointments').delete().eq('id', id);
        if (error) console.error('Error deleting appointment:', error);
        get().fetchData();
      },

      addTask: async (task) => {
        const { user } = get();
        const id = uuidv4();
        const { error } = await supabase.from('tasks').insert([{
          ...task,
          id,
          is_completed: false,
          user_id: user?.id,
          appointment_id: task.appointmentId,
          parent_id: task.parentId
        }]);
        if (error) console.error('Error adding task:', error);
        get().fetchData();
        return id;
      },
      updateTask: async (id, updated) => {
        const task = get().tasks.find(t => t.id === id);
        const dbUpdate: any = {
          ...updated,
          is_completed: updated.isCompleted,
          appointment_id: updated.appointmentId,
          parent_id: updated.parentId
        };
        delete dbUpdate.isCompleted;
        delete dbUpdate.appointmentId;
        delete dbUpdate.parentId;

        const { error } = await supabase.from('tasks').update(dbUpdate).eq('id', id);
        if (error) console.error('Error updating task:', error);

        if (task && task.appointmentId && updated.isCompleted !== undefined) {
          await supabase.from('appointments').update({ is_completed: updated.isCompleted }).eq('id', task.appointmentId);
        }

        get().fetchData();
      },
      deleteTask: async (id) => {
        const { error } = await supabase.from('tasks').delete().eq('id', id);
        if (error) console.error('Error deleting task:', error);
        get().fetchData();
      },

      addMemory: async (memory) => {
        const { user } = get();
        const { error } = await supabase.from('memories').insert([{
          ...memory,
          id: uuidv4(),
          user_id: user?.id,
          image_url: memory.imageUrl
        }]);
        if (error) console.error('Error adding memory:', error);
        get().fetchData();
      },
      updateMemory: async (id, updated) => {
        const { error } = await supabase.from('memories').update({
          ...updated,
          image_url: updated.imageUrl
        }).eq('id', id);
        if (error) console.error('Error updating memory:', error);
        get().fetchData();
      },
      deleteMemory: async (id) => {
        const { error } = await supabase.from('memories').delete().eq('id', id);
        if (error) console.error('Error deleting memory:', error);
        get().fetchData();
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

      getSubAppointments: (parentId) => {
        const state = useAppStore.getState();
        return state.appointments.filter(a => a.parentId === parentId);
      },

      getSubTasks: (parentId) => {
        const state = useAppStore.getState();
        return state.tasks.filter(t => t.parentId === parentId);
      },
    }),
    {
      name: 'assistant-pessoal-v3',
    }
  )
);
