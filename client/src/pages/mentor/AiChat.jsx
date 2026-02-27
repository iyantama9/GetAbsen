import { useState, useRef, useEffect } from 'react';
import api from '../../api/client';
import { Send, Bot, Sparkles, Trash2 } from 'lucide-react';

export default function AiChat() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Halo! Saya AI Assistant GetAbsen, powered by **Gemini Flash** ⚡\n\nSaya bisa membantu kamu memantau progress intern, menganalisis data absensi, dan memberikan insight. Tanya apa saja!' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    const newMessages = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setLoading(true);
    try {
      // Send conversation history (exclude first greeting)
      const history = newMessages.slice(1).map(m => ({ role: m.role, content: m.content }));
      const res = await api.post('/admin/mentor/ai-query', { query: userMsg, messages: history.slice(0, -1) });
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.data.response }]);
    } catch (err) {
      const errMsg = err.response?.status === 501
        ? 'API key belum dikonfigurasi. Hubungi admin.'
        : err.response?.status === 502
        ? 'Gagal menghubungi AI API. Coba lagi nanti.'
        : 'Terjadi error. Silakan coba lagi.';
      setMessages(prev => [...prev, { role: 'assistant', content: errMsg }]);
    } finally { setLoading(false); }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };
  const clearChat = () => setMessages([messages[0]]);

  // Simple markdown-ish rendering for bold
  const renderContent = (text) => {
    return text.split(/(\*\*.*?\*\*)/g).map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] lg:h-[calc(100vh-4rem)] animate-fade-in-up">
      <div className="page-header flex-shrink-0 flex items-start justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Bot size={20} style={{ color: 'var(--color-primary)' }} />
            AI Assistant
          </h1>
          <p className="page-subtitle flex items-center gap-2 mt-1">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full font-bold tracking-wide" style={{ background: 'rgba(16,185,129,0.1)', color: '#059669' }}>
              <Sparkles size={10} /> GEMINI FLASH
            </span>
            Powered by Getcore.ID
          </p>
        </div>
        {messages.length > 1 && (
          <button onClick={clearChat} className="btn btn-ghost text-xs gap-1 cursor-pointer" style={{ color: 'var(--color-text-muted)' }}>
            <Trash2 size={13} /> Clear
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mr-2" style={{ background: 'var(--color-primary-100)' }}>
                <Bot size={14} style={{ color: 'var(--color-primary)' }} />
              </div>
            )}
            <div className="max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap"
              style={msg.role === 'user'
                ? { background: 'var(--color-primary)', color: 'white', borderBottomRightRadius: '0.375rem' }
                : { background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)', borderBottomLeftRadius: '0.375rem' }
              }
            >
              {renderContent(msg.content)}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start animate-fade-in">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mr-2" style={{ background: 'var(--color-primary-100)' }}>
              <Bot size={14} style={{ color: 'var(--color-primary)' }} />
            </div>
            <div className="rounded-2xl px-4 py-3" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderBottomLeftRadius: '0.375rem' }}>
              <div className="flex gap-1">
                {[0, 150, 300].map(d => <span key={d} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--color-text-muted)', animationDelay: `${d}ms` }} />)}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex-shrink-0 flex gap-2 sm:gap-3">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Tanya tentang progress intern..." className="input flex-1" disabled={loading} />
        <button onClick={handleSend} disabled={loading || !input.trim()} className="btn btn-primary px-3 sm:px-5 cursor-pointer">
          <Send size={16} />
          <span className="hidden sm:inline">Send</span>
        </button>
      </div>
    </div>
  );
}
