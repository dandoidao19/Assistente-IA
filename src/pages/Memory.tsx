import { useState } from 'react';
import { useAppStore } from '../store';
import { Folder, Link as LinkIcon, Image as ImageIcon, Video, FileText, Trash2, Search, X, Calendar, ExternalLink } from 'lucide-react';
import { safeFormat } from '../utils/date';
import { LinkifiedText } from '../components/LinkifiedText';

export function Memory() {
  const memories = useAppStore((state) => state.memories || []);
  const deleteMemory = useAppStore((state) => state.deleteMemory);
  const [search, setSearch] = useState('');
  const [selectedMemoryId, setSelectedMemoryId] = useState<string | null>(null);

  const selectedMemory = (memories || []).find(m => m.id === selectedMemoryId);

  const filteredMemories = (memories || []).filter(m => 
    (m.title || '').toLowerCase().includes(search.toLowerCase()) || 
    (m.content || '').toLowerCase().includes(search.toLowerCase()) ||
    (m.folder || '').toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filteredMemories.reduce((acc, memory) => {
    const folder = memory.folder || 'Geral';
    if (!acc[folder]) acc[folder] = [];
    acc[folder].push(memory);
    return acc;
  }, {} as Record<string, typeof memories>);

  const sortedFolders = Object.keys(grouped).sort();

  const getIcon = (type: string) => {
    switch (type) {
      case 'link': return <LinkIcon size={16} className="text-blue-500" />;
      case 'image': return <ImageIcon size={16} className="text-emerald-500" />;
      case 'video': return <Video size={16} className="text-purple-500" />;
      default: return <FileText size={16} className="text-amber-500" />;
    }
  };

  return (
    <div className="py-4 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Memória</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Suas notas, links e ideias guardadas.</p>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" size={18} />
        <input 
          type="text" 
          placeholder="Buscar memórias..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2 pl-10 pr-4 outline-none focus:border-indigo-500 dark:text-zinc-200"
        />
      </div>

      {sortedFolders.length === 0 ? (
        <div className="text-center py-10 text-zinc-400 dark:text-zinc-600">
          <p>Nenhuma memória encontrada.</p>
          <p className="text-sm mt-2">Diga: "Salva pra mim na pasta de restaurantes..."</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedFolders.map(folder => (
              <div 
                key={folder} 
                className="space-y-3"
              >
                <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200 font-medium">
                  <Folder size={18} className="text-indigo-500 dark:text-indigo-400" />
                  <h2>{folder}</h2>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {grouped[folder].map(memory => (
                    <div 
                      key={memory.id} 
                      onClick={() => setSelectedMemoryId(memory.id)}
                      className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          {getIcon(memory.type)}
                          <h3 className="font-medium text-zinc-900 dark:text-zinc-100">{memory.title}</h3>
                        </div>
                        <button onClick={(e) => {
                          e.stopPropagation();
                          deleteMemory(memory.id);
                        }} className="text-zinc-400 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 p-1">
                          <Trash2 size={16} />
                        </button>
                      </div>
                      {memory.type === 'link' ? (
                        <div className="text-sm text-indigo-600 dark:text-indigo-400 truncate">
                          {memory.content}
                        </div>
                      ) : (
                        <div className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                          <LinkifiedText text={memory.content || ''} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
      {/* Memory Detail Modal */}
      {selectedMemoryId && selectedMemory && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div
            className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden flex flex-col"
          >
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl">
                    <Folder size={20} />
                  </div>
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Detalhes da Memória</h2>
                </div>
                <button 
                  onClick={() => setSelectedMemoryId(null)}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-500 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{selectedMemory.title}</h1>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-2 py-1 rounded-lg">
                        Pasta: {selectedMemory.folder}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-lg flex items-center gap-1">
                        {getIcon(selectedMemory.type)}
                        {selectedMemory.type}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 rounded-2xl">
                  <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Conteúdo</p>
                  {selectedMemory.type === 'link' ? (
                    <a
                      href={selectedMemory.content}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-2 break-all"
                    >
                      {selectedMemory.content}
                      <ExternalLink size={14} className="shrink-0" />
                    </a>
                  ) : (
                    <div className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                      <LinkifiedText text={selectedMemory.content || ''} />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-wider">
                  <Calendar size={12} />
                  <span>Salvo em {safeFormat(selectedMemory.createdAt, "dd 'de' MMMM 'de' yyyy 'às' HH:mm")}</span>
                </div>
              </div>
          </div>
        </div>
      )}
    </div>
  );
}
