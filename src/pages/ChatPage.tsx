import React, { useState, useRef, useEffect } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import ReactMarkdown from 'react-markdown';
import { Send, Loader2, Bot, User, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getChatStreamUrl } from '../services/api';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const ChatPage: React.FC = () => {
  const { token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [category, setCategory] = useState('computer-science');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isStreaming || !token) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      text: input.trim(),
      sender: 'user',
      timestamp: new Date(),
    };
    const aiMessageId = crypto.randomUUID();

    setMessages((prev) => [
      ...prev,
      userMessage,
      { id: aiMessageId, text: '', sender: 'ai', timestamp: new Date() },
    ]);
    setInput('');
    setIsStreaming(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      await fetchEventSource(getChatStreamUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({
          question: userMessage.text,
          chatId: 'session-1',
          category,
        }),
        signal: ctrl.signal,
        onmessage(event) {
          if (event.data) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessageId ? { ...msg, text: msg.text + event.data } : msg
              )
            );
          }
        },
        onclose() {
          setIsStreaming(false);
        },
        onerror(err) {
          console.error('Stream error:', err);
          setIsStreaming(false);
          throw err;
        },
      });
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Chat failed:', err);
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            text: '⚠️ Failed to connect to the AI. Please check the backend is running.',
            sender: 'ai',
            timestamp: new Date(),
          },
        ]);
      }
      setIsStreaming(false);
    }
  };

  const stopStreaming = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-800/60 bg-slate-900/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-linear-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/20">
            <Sparkles className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">AI Chat</h2>
            <p className="text-xs text-slate-500">Powered by DeepSeek R1</p>
          </div>
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
        >
          <option value="computer-science">Computer Science</option>
          <option value="mathematics">Mathematics</option>
          <option value="physics">Physics</option>
          <option value="general">General</option>
        </select>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full min-h-100 text-center">
              <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
                <Bot className="w-10 h-10 text-emerald-400/60" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Start a Conversation</h3>
              <p className="text-slate-500 max-w-sm">
                Upload a document first, then ask questions about its content. The AI will use RAG to provide accurate answers.
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'ai' && (
                <div className="shrink-0 w-8 h-8 rounded-lg bg-linear-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/20 flex items-center justify-center mt-1">
                  <Bot className="w-4 h-4 text-emerald-400" />
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                  msg.sender === 'user'
                    ? 'bg-linear-to-r from-emerald-600 to-emerald-500 text-white rounded-br-md shadow-lg shadow-emerald-500/10'
                    : 'bg-slate-800/80 text-slate-200 border border-slate-700/60 rounded-bl-md'
                }`}
              >
                {msg.sender === 'ai' ? (
                  <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-700 prose-code:text-emerald-400">
                    <ReactMarkdown>{msg.text || (isStreaming && msg.text === '' ? '...' : '')}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                )}
                <p className={`text-[10px] mt-1.5 ${msg.sender === 'user' ? 'text-emerald-200/60' : 'text-slate-600'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {msg.sender === 'user' && (
                <div className="shrink-0 w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/20 flex items-center justify-center mt-1">
                  <User className="w-4 h-4 text-emerald-400" />
                </div>
              )}
            </div>
          ))}

          {isStreaming && (
            <div className="flex justify-center">
              <button
                onClick={stopStreaming}
                className="text-xs text-slate-500 hover:text-slate-300 bg-slate-800 border border-slate-700 rounded-full px-4 py-1.5 transition-colors"
              >
                Stop generating
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-slate-800/60 bg-slate-900/80 backdrop-blur-sm px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isStreaming}
              placeholder="Ask about your documents..."
              rows={1}
              className="w-full bg-slate-800/60 border border-slate-700/60 text-white rounded-xl px-4 py-3 pr-12 resize-none placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 disabled:opacity-50 transition-all"
              style={{ minHeight: '48px', maxHeight: '160px' }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = 'auto';
                el.style.height = Math.min(el.scrollHeight, 160) + 'px';
              }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={isStreaming || !input.trim()}
            className="shrink-0 flex items-center justify-center w-12 h-12 rounded-xl bg-linear-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
          >
            {isStreaming ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
