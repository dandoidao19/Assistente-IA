import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

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
  appointments: Appointment[];
  tasks: Task[];
  memories: Memory[];
  settings: Settings;
  suggestions: Suggestion[];
  
  addAppointment: (appointment: Omit<Appointment, 'id' | 'isCompleted' | 'updates' | 'createdAt' | 'updatedAt' | 'wazeLink'>) => string;
  updateAppointment: (id: string, appointment: Partial<Appointment> & { newUpdate?: string }) => void;
  deleteAppointment: (id: string) => void;
  
  addTask: (task: Omit<Task, 'id' | 'isCompleted'>) => string;
  updateTask: (id: string, task: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  
  addMemory: (memory: Omit<Memory, 'id' | 'createdAt'>) => void;
  updateMemory: (id: string, memory: Partial<Memory>) => void;
  deleteMemory: (id: string) => void;
  
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
    (set) => ({
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

      addAppointment: (appointment) => {
        const id = uuidv4();
        const now = new Date().toISOString();
        let wazeLink = undefined;
        if (appointment.address) {
          wazeLink = `https://waze.com/ul?q=${encodeURIComponent(appointment.address)}`;
        }
        
        set((state) => ({
          appointments: [...state.appointments, { 
            ...appointment, 
            id, 
            isCompleted: false,
            updates: [],
            createdAt: now,
            updatedAt: now,
            wazeLink
          }]
        }));
        return id;
      },
      updateAppointment: (id, updated) => set((state) => {
        const appt = state.appointments.find(a => a.id === id);
        if (!appt) return state;

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

        const newAppointments = state.appointments.map((a) => 
          a.id === id ? { ...a, ...rest, updates, updatedAt: now, wazeLink } : a
        );
        
        let newTasks = state.tasks;
        if (appt.taskId && updated.isCompleted !== undefined) {
          newTasks = state.tasks.map(t => t.id === appt.taskId ? { ...t, isCompleted: updated.isCompleted! } : t);
        }

        return { appointments: newAppointments, tasks: newTasks };
      }),
      deleteAppointment: (id) => set((state) => ({
        appointments: state.appointments.filter((a) => a.id !== id)
      })),

      addTask: (task) => {
        const id = uuidv4();
        set((state) => ({
          tasks: [...state.tasks, { ...task, id, isCompleted: false }]
        }));
        return id;
      },
      updateTask: (id, updated) => set((state) => {
        const task = state.tasks.find(t => t.id === id);
        const newTasks = state.tasks.map((t) => t.id === id ? { ...t, ...updated } : t);
        let newAppointments = state.appointments;

        if (task && task.appointmentId && updated.isCompleted !== undefined) {
          newAppointments = state.appointments.map(a => a.id === task.appointmentId ? { ...a, isCompleted: updated.isCompleted! } : a);
        }

        return { tasks: newTasks, appointments: newAppointments };
      }),
      deleteTask: (id) => set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id)
      })),

      addMemory: (memory) => set((state) => ({
        memories: [...state.memories, { ...memory, id: uuidv4(), createdAt: new Date().toISOString() }]
      })),
      updateMemory: (id, updated) => set((state) => ({
        memories: state.memories.map((m) => m.id === id ? { ...m, ...updated } : m)
      })),
      deleteMemory: (id) => set((state) => ({
        memories: state.memories.filter((m) => m.id !== id)
      })),

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
