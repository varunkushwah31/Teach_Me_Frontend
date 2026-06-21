import React, { useState, useRef, useEffect, useCallback } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import ReactMarkdown from 'react-markdown';
import { Send, Bot, User, Sparkles, MessageSquare, Plus, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
    getChatStreamUrl,
    getRecentChats,
    getChatSessionHistory,
    searchChatHistory,
    type ChatHistoryDTO
} from '../services/api';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
}

interface Session {
    sessionId: string;
    title: string;
    date: Date;
}

const ChatPage: React.FC = () => {
    const { token } = useAuth();

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [category, setCategory] = useState('computer-science');

    const [currentSessionId, setCurrentSessionId] = useState<string>(crypto.randomUUID());
    const [historySessions, setHistorySessions] = useState<Session[]>([]);
    const [sidebarSearch, setSidebarSearch] = useState('');

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        if (!token) return;

        let isMounted = true;
        const fetchPromise = sidebarSearch.trim()
            ? searchChatHistory(token, sidebarSearch.trim(), 0, 50)
            : getRecentChats(token, 0, 50);

        fetchPromise
            .then((res) => {
                if (!isMounted) return;

                const sessionMap = new Map<string, Session>();
                res.content.forEach((chat: ChatHistoryDTO) => {
                    if (!sessionMap.has(chat.sessionId)) {
                        sessionMap.set(chat.sessionId, {
                            sessionId: chat.sessionId,
                            title: chat.question,
                            date: new Date(chat.createdAt),
                        });
                    }
                });
                setHistorySessions(Array.from(sessionMap.values()));
            })
            .catch((err) => {
                console.error("Failed to fetch history:", err);
            });

        return () => { isMounted = false; };
    }, [token, sidebarSearch]);

    const loadSession = async (sessionId: string) => {
        if (!token || isStreaming) return;
        setCurrentSessionId(sessionId);
        setMessages([]);

        try {
            const res = await getChatSessionHistory(token, sessionId, 0, 50);
            const loadedMessages: Message[] = [];
            const reversedContent = [...res.content].reverse();

            reversedContent.forEach((chat) => {
                loadedMessages.push(
                    { id: `q-${chat.id}`, text: chat.question, sender: 'user', timestamp: new Date(chat.createdAt) },
                    { id: `a-${chat.id}`, text: chat.answer, sender: 'ai', timestamp: new Date(chat.createdAt) }
                );
            });
            setMessages(loadedMessages);
        } catch (err) {
            console.error("Failed to load session history", err);
        }
    };

    const createNewSession = () => {
        setCurrentSessionId(crypto.randomUUID());
        setMessages([]);
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length]);

    const handleStreamMessage = useCallback((chunk: string, aiMessageId: string) => {
        if (chunk && chunk !== '[DONE]') {
            setMessages((prev) =>
                prev.map((msg) => msg.id === aiMessageId ? { ...msg, text: msg.text + chunk } : msg)
            );
        }
    }, []);

    const handleSend = async () => {
        if (!input.trim() || isStreaming || !token) return;

        const userMessage: Message = { id: crypto.randomUUID(), text: input.trim(), sender: 'user', timestamp: new Date() };
        const aiMessageId = crypto.randomUUID();

        setMessages((prev) => [...prev, userMessage, { id: aiMessageId, text: '', sender: 'ai', timestamp: new Date() }]);
        setInput('');
        setIsStreaming(true);

        if (inputRef.current) inputRef.current.style.height = 'auto';

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
                body: JSON.stringify({ question: userMessage.text, chatId: currentSessionId, category }),
                signal: ctrl.signal,
                onmessage(event) { handleStreamMessage(event.data, aiMessageId); },
                onclose() { setIsStreaming(false); },
                onerror(err) { throw err; },
            });

            setHistorySessions((prev) => {
                if (!prev.some(s => s.sessionId === currentSessionId)) {
                    return [{ sessionId: currentSessionId, title: userMessage.text, date: new Date() }, ...prev];
                }
                return prev;
            });

        } catch (err) {
            if ((err as Error).name !== 'AbortError') {
                setMessages((prev) => [...prev, { id: crypto.randomUUID(), text: '⚠️ Failed to connect to the AI.', sender: 'ai', timestamp: new Date() }]);
            }
            setIsStreaming(false);
        }
    };

    return (
        <div className="flex h-full bg-[#0a0a0a]">

            {/* Sidebar: History */}
            <div className="w-64 shrink-0 bg-[#111111]/85 backdrop-blur-xl border-r border-zinc-800/60 hidden md:flex flex-col">
                <div className="p-4 border-b border-zinc-800/60 space-y-3">
                    <button onClick={createNewSession} className="w-full flex items-center justify-center gap-2 bg-[#5b4fff]/10 hover:bg-[#5b4fff]/20 text-[#968fff] border border-[#5b4fff]/20 py-2.5 rounded-xl text-sm font-medium transition-colors">
                        <Plus className="w-4 h-4" /> New Chat
                    </button>

                    <div className="relative">
                        <label htmlFor="chat-search" className="sr-only">Search past chats</label>
                        <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            id="chat-search"
                            type="text"
                            placeholder="Search chats..."
                            value={sidebarSearch}
                            onChange={(e) => setSidebarSearch(e.target.value)}
                            className="w-full bg-[#1a1a1a] border border-zinc-800/80 text-xs text-white rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#5b4fff]/40 placeholder-zinc-600"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-1">
                    <p className="px-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 mt-2">Recent</p>
                    {historySessions.length === 0 ? (
                        <p className="px-2 text-xs text-zinc-600 mt-4 text-center">No chats found.</p>
                    ) : (
                        historySessions.map(session => (
                            <button
                                key={session.sessionId}
                                onClick={() => void loadSession(session.sessionId)}
                                className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                                    currentSessionId === session.sessionId ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                                }`}
                            >
                                <MessageSquare className="w-4 h-4 shrink-0" />
                                <div className="truncate flex-1">
                                    <span className="truncate block">{session.title}</span>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex flex-col flex-1 min-w-0">
                <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-zinc-800/60 bg-[#111111]/85 backdrop-blur-xl">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-linear-to-br from-[#5b4fff]/20 to-[#968fff]/20 border border-[#5b4fff]/20">
                            <Sparkles className="w-5 h-5 text-[#968fff]" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white tracking-tight">AI Assistant</h2>
                            <p className="text-xs text-zinc-500">Session: {currentSessionId.split('-')[0]}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <label htmlFor="category-select" className="sr-only">Select Category</label>
                        <select id="category-select" value={category} onChange={(e) => setCategory(e.target.value)} className="bg-[#1a1a1a] border border-zinc-800/80 text-zinc-300 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#5b4fff]/50 transition-all">
                            <option value="computer-science">Computer Science</option>
                            <option value="mathematics">Mathematics</option>
                            <option value="general">General</option>
                        </select>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-6">
                    <div className="max-w-3xl mx-auto space-y-6">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full min-h-100 text-center">
                                <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-[#5b4fff]/10 to-[#968fff]/10 border border-[#5b4fff]/20 flex items-center justify-center mb-6"><Bot className="w-10 h-10 text-[#968fff]/60" /></div>
                                <h3 className="text-xl font-semibold text-white tracking-tight mb-2">Start a New Conversation</h3>
                                <p className="text-zinc-500 max-w-sm">Your chat history is securely saved and isolated.</p>
                            </div>
                        )}

                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.sender === 'ai' && <div className="shrink-0 w-8 h-8 rounded-lg bg-linear-to-br from-[#5b4fff]/20 to-[#968fff]/20 border border-[#5b4fff]/20 flex items-center justify-center mt-1"><Bot className="w-4 h-4 text-[#968fff]" /></div>}
                                <div className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-lg ${msg.sender === 'user' ? 'bg-[#5b4fff] text-white rounded-br-md shadow-[#5b4fff]/10' : 'bg-[#1a1a1a] text-zinc-200 border border-zinc-800/50 rounded-bl-md shadow-black/20'}`}>
                                    {msg.sender === 'ai' ? <div className="prose prose-invert prose-sm max-w-none"><ReactMarkdown>{msg.text || (isStreaming && msg.text === '' ? '...' : '')}</ReactMarkdown></div> : <p className="whitespace-pre-wrap">{msg.text}</p>}
                                </div>
                                {msg.sender === 'user' && <div className="shrink-0 w-8 h-8 rounded-lg bg-[#5b4fff]/20 border border-[#5b4fff]/20 flex items-center justify-center mt-1"><User className="w-4 h-4 text-[#b4afff]" /></div>}
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                <div className="shrink-0 border-t border-zinc-800/60 bg-[#111111]/85 backdrop-blur-xl px-4 py-4">
                    <div className="max-w-3xl mx-auto flex gap-3">
                        <label htmlFor="chat-input" className="sr-only">Type your message</label>
                        <textarea id="chat-input" ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSend(); }}} disabled={isStreaming} placeholder="Ask a question..." className="flex-1 bg-[#1a1a1a]/80 border border-zinc-800/80 text-white rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-1 focus:ring-[#5b4fff]/50 transition-all placeholder-zinc-500" style={{ minHeight: '48px', maxHeight: '160px' }} />
                        <button onClick={() => void handleSend()} disabled={isStreaming || !input.trim()} className="shrink-0 w-12 h-12 rounded-xl bg-[#5b4fff] hover:bg-[#5b4fff]/90 text-white flex items-center justify-center disabled:opacity-40 shadow-lg shadow-[#5b4fff]/20 border border-[#968fff]/20 transition-all"><Send className="w-5 h-5" /></button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatPage;