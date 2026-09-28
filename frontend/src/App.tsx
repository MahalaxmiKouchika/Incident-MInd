import { useState, useRef, useEffect } from 'react';
import { Send, Settings, History, BrainCircuit, Activity, Database, AlertCircle, CheckCircle2, ChevronRight, Menu, Loader2 } from 'lucide-react';
import { sendMessage } from './api/incidentmind';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  memory_used?: boolean;
  memories?: any[];
  sources?: string[];
  tools_used?: string[];
};

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [conversationId, setConversationId] = useState(() => (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const data = await sendMessage({
        message: userMsg.content,
        conversationId,
        memoryEnabled: memoryEnabled,
      });
      
      const assistantMsg: Message = {
        id: Date.now().toString() + 1,
        role: 'assistant',
        content: data.answer,
        memory_used: data.memory_used,
        memories: data.memories,
        sources: data.sources,
        tools_used: data.tools_used
      };
      
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      const errorMsg: Message = {
        id: Date.now().toString() + 1,
        role: 'assistant',
        content: error instanceof Error ? error.message : "AI Agent is temporarily unavailable.",
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden text-slate-100">
      {/* Sidebar */}
      <div className={cn("glass-panel flex flex-col transition-all duration-300 z-20", sidebarOpen ? "w-64" : "w-0 opacity-0 overflow-hidden")}>
        <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg text-primary">
            <Activity className="w-5 h-5" />
            <span>IncidentMind</span>
          </div>
        </div>
        <div className="flex-1 p-4 overflow-y-auto">
          <button 
            onClick={() => { setMessages([]); setConversationId((typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString()); }}
            className="w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg p-2 flex items-center gap-2 transition-colors mb-6"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm font-medium">New Chat</span>
          </button>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-slate-400 mb-2 px-2 uppercase tracking-wider">Memory Status</h3>
              <div className="flex items-center justify-between px-2 py-2 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <div className="flex items-center gap-2">
                  <BrainCircuit className={cn("w-4 h-4", memoryEnabled ? "text-primary" : "text-slate-500")} />
                  <span className="text-sm">Hindsight</span>
                </div>
                <button 
                  onClick={() => setMemoryEnabled(!memoryEnabled)}
                  className={cn("relative inline-flex h-5 w-9 items-center rounded-full transition-colors", memoryEnabled ? "bg-primary" : "bg-slate-600")}
                >
                  <span className={cn("inline-block h-3 w-3 transform rounded-full bg-white transition-transform", memoryEnabled ? "translate-x-5" : "translate-x-1")} />
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2 px-2">
                {memoryEnabled ? "Agent can search historical incidents." : "Agent relies on current evidence only."}
              </p>
            </div>
            
            <div>
              <h3 className="text-xs font-semibold text-slate-400 mb-2 px-2 uppercase tracking-wider">Recent Chats</h3>
              <div className="space-y-1">
                {['Database Timeout', 'Frontend 401 Issue', 'What is FastAPI?'].map((chat, i) => (
                  <button key={i} className="w-full text-left px-2 py-1.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800/50 rounded truncate transition-colors">
                    {chat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-slate-700/50">
          <button className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative z-10">
        <header className="h-14 flex items-center px-4 border-b border-slate-700/50 glass-panel">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
            <Menu className="w-5 h-5" />
          </button>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6 scroll-smooth">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-70">
              <BrainCircuit className="w-16 h-16 text-primary mb-4" />
              <h2 className="text-2xl font-bold mb-2">How can I help you investigate today?</h2>
              <p className="text-slate-400 max-w-md">
                Ask me about system status, current incidents, or enable Hindsight memory to search for past solutions.
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-3xl rounded-2xl px-5 py-4 shadow-sm", msg.role === 'user' ? "bg-primary text-white" : "glass-panel text-slate-200")}>
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2 text-primary font-medium">
                      <Activity className="w-4 h-4" />
                      <span className="text-sm uppercase tracking-wider">IncidentMind</span>
                    </div>
                  )}
                  <div className="prose prose-invert max-w-none">
                    {msg.content}
                  </div>
                  
                  {/* Memory & Tools Panel */}
                  {msg.role === 'assistant' && msg.memory_used && (
                    <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-400/10 w-fit px-2 py-1 rounded">
                        <Database className="w-3 h-3" />
                        MEMORY USED
                      </div>
                      
                      {msg.memories && msg.memories.length > 0 && (
                        <div className="bg-slate-900/50 rounded-lg p-3 text-sm border border-slate-700/50">
                          <p className="text-slate-400 mb-2 font-medium">Historical memory:</p>
                          <ul className="space-y-2">
                            {msg.memories.map((mem: any, i: number) => (
                              <li key={i} className="flex gap-2">
                                <span className="text-primary font-mono">{mem.id}</span>
                                <span className="text-slate-300">- {mem.summary}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="text-xs text-slate-400 flex gap-2">
                          <span className="font-semibold">Source:</span>
                          {msg.sources.join(', ')}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Tools Panel without memory */}
                  {msg.role === 'assistant' && !msg.memory_used && msg.tools_used && msg.tools_used.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-2">
                       <div className="text-xs text-slate-400 flex items-center gap-1">
                          <Activity className="w-3 h-3" />
                          <span className="font-semibold">CURRENT EVIDENCE</span>
                        </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="glass-panel max-w-3xl rounded-2xl px-5 py-4 shadow-sm flex items-center gap-3">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
                <span className="text-sm text-slate-400 animate-pulse">Generating answer...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="p-4 bg-background">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative group">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={memoryEnabled ? "Ask about an incident (Hindsight enabled)..." : "Ask about an incident (Current evidence only)..."}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-4 pr-12 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all text-sm group-hover:border-slate-600 shadow-sm"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:hover:bg-primary transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="text-center mt-2 text-xs text-slate-500">
            IncidentMind AI Agent - Do not enter sensitive production credentials.
          </div>
        </div>
      </div>
    </div>
  );
}
