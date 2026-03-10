import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { useAppStore } from '../store';
import { toast } from 'react-hot-toast';
import { GoogleGenAI, LiveServerMessage, Modality, Type } from '@google/genai';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function base64ToFloat32Array(base64: string): Float32Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const int16Array = new Int16Array(bytes.buffer);
  const float32Array = new Float32Array(int16Array.length);
  for (let i = 0; i < int16Array.length; i++) {
    float32Array[i] = int16Array[i] / 32768.0;
  }
  return float32Array;
}

function float32ArrayToBase64(float32Array: Float32Array): string {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  const bytes = new Uint8Array(int16Array.buffer);
  let binaryString = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binaryString += String.fromCharCode(bytes[i]);
  }
  return btoa(binaryString);
}

export function AssistantFAB() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const isConnectedRef = useRef(false);
  
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const playbackContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextPlayTimeRef = useRef<number>(0);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const appointments = useAppStore((state) => state.appointments || []);
  const tasks = useAppStore((state) => state.tasks || []);
  const memories = useAppStore((state) => state.memories || []);

  const addAppointment = useAppStore((state) => state.addAppointment);
  const updateAppointment = useAppStore((state) => state.updateAppointment);
  const deleteAppointment = useAppStore((state) => state.deleteAppointment);

  const addTask = useAppStore((state) => state.addTask);
  const updateTask = useAppStore((state) => state.updateTask);
  const deleteTask = useAppStore((state) => state.deleteTask);

  const addMemory = useAppStore((state) => state.addMemory);
  const updateMemory = useAppStore((state) => state.updateMemory);
  const deleteMemory = useAppStore((state) => state.deleteMemory);

  const settings = useAppStore((state) => state.settings);

  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, []);

  const playAudioChunk = (base64: string) => {
    if (!playbackContextRef.current) return;
    const ctx = playbackContextRef.current;
    const float32Array = base64ToFloat32Array(base64);
    const buffer = ctx.createBuffer(1, float32Array.length, 24000);
    buffer.copyToChannel(float32Array as any, 0);
    
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    
    const startTime = Math.max(nextPlayTimeRef.current, ctx.currentTime);
    source.start(startTime);
    nextPlayTimeRef.current = startTime + buffer.duration;
  };

  const stopAudio = () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (sessionRef.current) {
      try {
        sessionRef.current.close();
      } catch {
        // Ignore close errors
      }
      sessionRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (playbackContextRef.current) {
      playbackContextRef.current.close();
      playbackContextRef.current = null;
    }
    setIsConnected(false);
    isConnectedRef.current = false;
    setIsConnecting(false);
  };

  const cleanTitle = (title: string) => {
    return title.replace(/^(title|título):\s*/i, '').trim();
  };

  const resetSilenceTimer = () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(() => {
      if (sessionRef.current) {
        sessionRef.current.send({ clientContent: { turns: [{ role: "user", parts: [{ text: "Estou em silêncio há 5 segundos. Pode processar o que eu disse ou perguntar se preciso de algo." }] }] } });
      }
    }, 5000);
  };

  const startAudio = async () => {
    setIsConnecting(true);
    isConnectedRef.current = false;
    try {
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      playbackContextRef.current = new AudioContext({ sampleRate: 24000 });
      
      if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();
      if (playbackContextRef.current.state === 'suspended') await playbackContextRef.current.resume();

      nextPlayTimeRef.current = playbackContextRef.current.currentTime;

      console.log('Requesting microphone permission...');
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      
      const gainNode = audioContextRef.current.createGain();
      gainNode.gain.value = 0;
      processorRef.current.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      source.connect(processorRef.current);

      const now = new Date().toLocaleString('pt-BR');
      const voiceName = (settings?.voiceType === 'voice1') ? 'Kore' : (settings?.voiceType === 'voice2') ? 'Fenrir' : 'Zephyr';

      const apptSummary = appointments.map(a => ({ id: a.id, title: a.title, date: a.date, time: a.time }));
      const taskSummary = tasks.map(t => ({ id: t.id, title: t.title, isCompleted: t.isCompleted }));
      const memorySummary = memories.map(m => ({ id: m.id, title: m.title, folder: m.folder }));

      const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!geminiKey) {
        console.error('Environment variable VITE_GEMINI_API_KEY is missing');
        toast.error('Chave do Gemini não configurada.');
        setIsConnecting(false);
        return;
      }
      console.log('Gemini API Key detected (prefix):', geminiKey.substring(0, 8) + '...');
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      console.log('Connecting to Gemini Live (v3.1)...');
      const sessionPromise = ai.live.connect({
        model: "models/gemini-2.0-flash-exp",
        callbacks: {
          onopen: () => {
            console.log('Gemini Live Connection Opened Successfully');
            setIsConnected(true);
            isConnectedRef.current = true;
            setIsConnecting(false);
            resetSilenceTimer();
            
            processorRef.current!.onaudioprocess = (e) => {
              if (!isConnectedRef.current) return;

              const inputData = e.inputBuffer.getChannelData(0);
              const base64 = float32ArrayToBase64(inputData);
              
              // Simple volume check to reset silence timer
              let sum = 0;
              for (let i = 0; i < inputData.length; i++) {
                sum += Math.abs(inputData[i]);
              }
              const average = sum / inputData.length;
              if (average > 0.01) { // threshold for speech
                resetSilenceTimer();
              }

              if (sessionRef.current && isConnectedRef.current) {
                try {
                  sessionRef.current.send({
                    realtimeInput: {
                      mediaChunks: [{
                        data: base64,
                        mimeType: 'audio/pcm;rate=16000'
                      }]
                    }
                  });
                } catch (err) {
                  console.error('Error sending audio data:', err);
                  isConnectedRef.current = false;
                  stopAudio();
                }
              }
            };
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.modelTurn?.parts) {
               console.log('Gemini Live Model Response');
            }
            if (message.serverContent?.interrupted) {
              nextPlayTimeRef.current = playbackContextRef.current?.currentTime || 0;
            }
            
            if (message.serverContent?.modelTurn?.parts) {
              for (const part of message.serverContent.modelTurn.parts) {
                if (part.inlineData?.data) {
                  playAudioChunk(part.inlineData.data);
                }
              }
            }

            if (message.toolCall?.functionCalls) {
              const functionResponses: any[] = [];
              for (const call of message.toolCall.functionCalls) {
                const { name, args, id } = call;
                let result = {};
                try {
                  if (name === 'addAppointment') {
                    addAppointment(args as any);
                    result = { success: true, message: "Compromisso adicionado." };
                    toast.success('Compromisso adicionado!');
                  } else if (name === 'updateAppointment') {
                    const { id: apptId, ...updates } = args as any;
                    updateAppointment(apptId, updates);
                    result = { success: true, message: "Compromisso atualizado." };
                    toast.success('Compromisso atualizado!');
                  } else if (name === 'deleteAppointment') {
                    deleteAppointment((args as any).id);
                    result = { success: true, message: "Compromisso excluído." };
                    toast.success('Compromisso excluído!');
                  } else if (name === 'addTasks') {
                    const tasksArgs = (args as any).tasks || [];
                    tasksArgs.forEach((t: any) => {
                      if (typeof t === 'string') {
                        addTask({ title: cleanTitle(t) });
                      } else if (t && t.title) {
                        addTask({ ...t, title: cleanTitle(t.title) });
                      } else if (t && t.task) {
                        addTask({ title: cleanTitle(t.task), note: t.note });
                      }
                    });
                    result = { success: true, message: "Tarefas adicionadas." };
                    toast.success('Tarefas adicionadas!');
                  } else if (name === 'updateTask') {
                    const { id: taskId, ...updates } = args as any;
                    if (updates.title) updates.title = cleanTitle(updates.title);
                    updateTask(taskId, updates);
                    result = { success: true, message: "Tarefa atualizada." };
                    toast.success('Tarefa atualizada!');
                  } else if (name === 'deleteTask') {
                    deleteTask((args as any).id);
                    result = { success: true, message: "Tarefa excluída." };
                    toast.success('Tarefa excluída!');
                  } else if (name === 'linkTaskToAppointment') {
                    const { taskId, date, time, note } = args as any;
                    const task = tasks.find(t => t.id === taskId);
                    if (task) {
                      const apptId = addAppointment({
                        title: `Tarefa: ${task.title}`,
                        date,
                        time,
                        note,
                        reminderTime: 15,
                        taskId: taskId
                      });
                      updateTask(taskId, { appointmentId: apptId });
                      result = { success: true, message: "Tarefa vinculada à agenda com sucesso." };
                      toast.success('Tarefa vinculada à agenda!');
                    } else {
                      result = { success: false, error: "Tarefa não encontrada." };
                    }
                  } else if (name === 'addMemory') {
                    addMemory(args as any);
                    result = { success: true, message: "Memória salva." };
                    toast.success('Memória salva!');
                  } else if (name === 'updateMemory') {
                    const { id: memId, ...updates } = args as any;
                    updateMemory(memId, updates);
                    result = { success: true, message: "Memória atualizada." };
                    toast.success('Memória atualizada!');
                  } else if (name === 'deleteMemory') {
                    deleteMemory((args as any).id);
                    result = { success: true, message: "Memória excluída." };
                    toast.success('Memória excluída!');
                  } else if (name === 'endConversation') {
                    stopAudio();
                    toast.success('Conversa encerrada.');
                    result = { success: true, message: "Conversa encerrada." };
                  }
                } catch (e) {
                  result = { success: false, error: String(e) };
                }
                functionResponses.push({ id: id || '', name, response: result });
              }
              
              sessionPromise.then((session: any) => {
                if (session.sendToolResponse) {
                  session.sendToolResponse({ functionResponses });
                } else if (session.send) {
                  session.send({ toolResponse: { functionResponses } });
                }
              });
            }
          },
          onclose: (event: any) => {
            console.log('Gemini Live Connection Closed:', event.code, event.reason || 'No reason');
            stopAudio();
          },
          onerror: (error) => {
            console.error('Gemini Live Error Details:', error);
            toast.error('Erro na conexão de voz.');
            stopAudio();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName } },
          },
          systemInstruction: {
            parts: [{
              text: `Você é um assistente pessoal conversacional em português.
Data e hora atual: ${now}.
Você deve conversar com o usuário, confirmar o que ele pediu e usar as ferramentas disponíveis para salvar, editar ou excluir compromissos, tarefas e memórias.

Aqui estão os dados atuais do usuário (use os IDs para editar ou excluir):
Compromissos: ${JSON.stringify(apptSummary)}
Tarefas: ${JSON.stringify(taskSummary)}
Memórias: ${JSON.stringify(memorySummary)}

REGRAS IMPORTANTES:
1. O usuário pode fazer pausas enquanto fala. Você SÓ deve processar o comando, dar uma resposta completa ou chamar ferramentas quando o usuário disser a palavra "ok?" ou "ok", OU quando você receber uma mensagem do sistema dizendo que o usuário está em silêncio há 5 segundos.
2. Se o usuário falar algo e NÃO disser "ok?" no final, responda apenas com um som curto de escuta como "aham", "estou ouvindo", "certo" e NÃO chame nenhuma ferramenta. Aguarde ele terminar.
3. Para compromissos, SEMPRE extraia a observação (note) e o endereço (address) se o usuário mencionar. Todo endereço será automaticamente convertido em link do Waze pelo sistema.
4. O app suporta hierarquia de eventos (Matrix e Secundários). Se o usuário pedir para adicionar algo "dentro" ou "relacionado" a um compromisso existente (ex: "comprar presente para o aniversário"), use a ferramenta 'addAppointment' passando o 'parentId' do compromisso matriz.
5. Você pode adicionar atualizações/observações extras a um compromisso existente usando a ferramenta 'updateAppointment' com o parâmetro 'newUpdate'.
6. Sempre pergunte se o usuário precisa de mais alguma coisa após executar uma ação (desde que ele tenha dito "ok?" ou ficado em silêncio).
7. Se o usuário disser que não precisa de mais nada, ou se despedir (ex: "só isso", "tchau", "obrigado"), você DEVE chamar a ferramenta 'endConversation' para encerrar a captura de áudio.
8. Seja natural, prestativo e conciso.`
            }]
          },
          tools: [{
            functionDeclarations: [
              {
                name: "addAppointment",
                description: "Adiciona um compromisso na agenda do usuário. Pode ser um evento matriz ou secundário.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING, description: "Título do compromisso" },
                    date: { type: Type.STRING, description: "Data no formato YYYY-MM-DD" },
                    time: { type: Type.STRING, description: "Hora no formato HH:mm" },
                    address: { type: Type.STRING, description: "Endereço do compromisso" },
                    note: { type: Type.STRING, description: "Observação importante sobre o compromisso" },
                    reminderTime: { type: Type.NUMBER, description: "Minutos de antecedência para lembrar (padrão 15)" },
                    parentId: { type: Type.STRING, description: "ID do compromisso matriz (se for um evento secundário)" }
                  },
                  required: ["title", "date", "time"]
                }
              },
              {
                name: "updateAppointment",
                description: "Edita um compromisso existente ou adiciona uma nova atualização/observação.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING, description: "ID do compromisso" },
                    title: { type: Type.STRING },
                    date: { type: Type.STRING },
                    time: { type: Type.STRING },
                    address: { type: Type.STRING },
                    note: { type: Type.STRING },
                    newUpdate: { type: Type.STRING, description: "Uma nova observação ou atualização para ser adicionada à lista de atualizações do evento" },
                    reminderTime: { type: Type.NUMBER },
                    isCompleted: { type: Type.BOOLEAN }
                  },
                  required: ["id"]
                }
              },
              {
                name: "deleteAppointment",
                description: "Exclui um compromisso existente.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING, description: "ID do compromisso" }
                  },
                  required: ["id"]
                }
              },
              {
                name: "addTasks",
                description: "Adiciona uma ou mais tarefas na lista de tarefas do usuário.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    tasks: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          title: { type: Type.STRING, description: "Título da tarefa" },
                          note: { type: Type.STRING, description: "Observação opcional" }
                        },
                        required: ["title"]
                      }
                    }
                  },
                  required: ["tasks"]
                }
              },
              {
                name: "updateTask",
                description: "Edita uma tarefa existente.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING, description: "ID da tarefa" },
                    title: { type: Type.STRING },
                    note: { type: Type.STRING },
                    isCompleted: { type: Type.BOOLEAN }
                  },
                  required: ["id"]
                }
              },
              {
                name: "deleteTask",
                description: "Exclui uma tarefa existente.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING, description: "ID da tarefa" }
                  },
                  required: ["id"]
                }
              },
              {
                name: "linkTaskToAppointment",
                description: "Vincula uma tarefa existente à agenda, criando um compromisso para ela.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    taskId: { type: Type.STRING, description: "ID da tarefa a ser vinculada" },
                    date: { type: Type.STRING, description: "Data no formato YYYY-MM-DD" },
                    time: { type: Type.STRING, description: "Hora no formato HH:mm" },
                    note: { type: Type.STRING, description: "Observação opcional para o compromisso" }
                  },
                  required: ["taskId", "date", "time"]
                }
              },
              {
                name: "addMemory",
                description: "Salva uma memória, nota, ideia ou link na área de memórias do usuário.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING, description: "Título da memória" },
                    folder: { type: Type.STRING, description: "Pasta ou categoria (ex: Restaurantes, Projetos, Geral)" },
                    content: { type: Type.STRING, description: "Conteúdo da memória (texto ou link)" },
                    type: { type: Type.STRING, description: "Tipo de conteúdo: 'text', 'link', 'image', ou 'video'" }
                  },
                  required: ["title", "folder", "content", "type"]
                }
              },
              {
                name: "updateMemory",
                description: "Edita uma memória existente.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING, description: "ID da memória" },
                    title: { type: Type.STRING },
                    folder: { type: Type.STRING },
                    content: { type: Type.STRING }
                  },
                  required: ["id"]
                }
              },
              {
                name: "deleteMemory",
                description: "Exclui uma memória existente.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING, description: "ID da memória" }
                  },
                  required: ["id"]
                }
              },
              {
                name: "endConversation",
                description: "Encerra a conversa e desliga o microfone. Use quando o usuário disser que não precisa de mais nada.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    reason: { type: Type.STRING, description: "Motivo do encerramento (ex: 'Usuário finalizou')" }
                  }
                }
              }
            ]
          }]
        },
      });

      const session = await sessionPromise;
      sessionRef.current = session;

    } catch (error) {
      console.error(error);
      toast.error('Erro ao iniciar o microfone.');
      stopAudio();
    }
  };

  const toggleConnection = () => {
    if (isConnected || isConnecting) {
      stopAudio();
    } else {
      startAudio();
    }
  };

  return (
    <>
      <div className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-50 flex flex-col items-end gap-4">
        {isConnected && (
          <div
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl shadow-2xl flex items-center gap-3 mb-2"
          >
            <div className="flex gap-1">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-1 h-3 bg-indigo-500 rounded-full animate-pulse"
                />
              ))}
            </div>
            <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Ouvindo...</span>
          </div>
        )}

        <button
          onClick={toggleConnection}
          className={cn(
            "w-16 h-16 text-white rounded-2xl shadow-2xl flex items-center justify-center transition-all duration-300 relative overflow-hidden group",
            isConnected 
              ? 'bg-red-500 shadow-red-500/40' 
              : isConnecting 
                ? 'bg-amber-500 shadow-amber-500/40' 
                : 'bg-indigo-600 shadow-indigo-600/40 hover:bg-indigo-700'
          )}
        >
          {isConnecting ? (
            <Loader2 size={28} className="animate-spin" />
          ) : isConnected ? (
            <Square size={24} fill="currentColor" className="relative z-10" />
          ) : (
            <Mic size={28} className="relative z-10" />
          )}
          
          {/* Pulse effect when connected */}
          {isConnected && (
            <div
              className="absolute inset-0 bg-white/20 rounded-full animate-ping"
            />
          )}
        </button>
      </div>
    </>
  );
}
