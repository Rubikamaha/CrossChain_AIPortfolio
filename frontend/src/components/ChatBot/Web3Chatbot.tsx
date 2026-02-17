import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Loader2, Sparkles, ArrowRight, Zap, Shield, Link } from 'lucide-react';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

const SUGGESTIONS = [
    { label: 'Highest APY?', icon: <Zap className="w-3 h-3" /> },
    { label: 'How to bridge?', icon: <Link className="w-3 h-3" /> },
    { label: 'Risk analysis?', icon: <Shield className="w-3 h-3" /> },
    { label: 'Token strategy?', icon: <Sparkles className="w-3 h-3" /> },
];

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

const CHAIN_ICONS = [
    { name: 'Ethereum', icon: '⟠', color: 'text-blue-400' },
    { name: 'Polygon', icon: '◈', color: 'text-purple-400' },
    { name: 'BSC', icon: '₿', color: 'text-yellow-400' },
    { name: 'Arbitrum', icon: '🟦', color: 'text-blue-500' },
    { name: 'Avalanche', icon: '🔺', color: 'text-red-500' },
];

export const Web3Chatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: "Hello! I'm your Cross-Chain AI Assistant. I can help you with bridging, yield optimization (APY), and portfolio strategy across ETH, Polygon, BSC, and more. How can I help?" }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleSend = async (content: string = input) => {
        if (!content.trim() || isLoading) return;

        // Keyword detection for immediate feedback (optional UI hint)
        const lowerContent = content.toLowerCase();
        if (lowerContent.includes("highest apy") || lowerContent.includes("yield")) {
            console.log("Detecting APY query...");
        }

        const userMessage: Message = { role: 'user', content };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch(`${BACKEND_URL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: newMessages }),
            });

            if (!response.ok) throw new Error('Failed to fetch response');

            const data = await response.json();
            setMessages((prev) => [...prev, data]);
        } catch (error) {
            console.error('Chat error:', error);
            const isQuotaError = error.toString().includes("429") || error.toString().includes("quota");
            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: isQuotaError
                        ? "I've reached my OpenAI quota limit (Error 429). Please check your API credits or billing details on the OpenAI dashboard to continue chatting!"
                        : 'Sorry, I encountered an error. Please check if the backend is running and the API key is valid.'
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 font-sans">
            {/* Chat Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 ease-in-out hover:rotate-12 ${isOpen ? 'bg-destructive shadow-destructive/20' : 'bg-primary hover:scale-110 shadow-primary/20'
                    }`}
            >
                {isOpen ? <X className="text-destructive-foreground w-6 h-6" /> : <div className="relative"><MessageSquare className="text-primary-foreground w-6 h-6" /><span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border-2 border-primary" /></div>}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="absolute bottom-20 right-0 w-[420px] h-[650px] max-h-[85vh] flex flex-col rounded-3xl overflow-hidden glass-card border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-8 zoom-in-95 duration-500">
                    {/* Header */}
                    <div className="p-6 bg-gradient-to-br from-primary/30 via-accent/20 to-transparent border-b border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center rotate-3 border border-white/10">
                                <Sparkles className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-base font-black tracking-tight text-foreground">CROSS-CHAIN AI</h3>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Active Intelligence</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Chain Icons Bar */}
                    <div className="px-6 py-2 bg-background/30 border-b border-white/5 flex items-center justify-between">
                        <div className="flex gap-3">
                            {CHAIN_ICONS.map((c) => (
                                <span key={c.name} className={`text-sm ${c.color} opacity-70 hover:opacity-100 transition-opacity cursor-default`} title={c.name}>
                                    {c.icon}
                                </span>
                            ))}
                        </div>
                        <span className="text-[9px] text-muted-foreground/40 font-mono">5 CHAINS SUPPORTED</span>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-hide">
                        {messages.map((m, i) => (
                            <div
                                key={i}
                                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-${m.role === 'user' ? 'right' : 'left'}-4 duration-300`}
                            >
                                <div
                                    className={`max-w-[85%] p-4 rounded-[2rem] text-sm leading-relaxed shadow-sm ${m.role === 'user'
                                        ? 'bg-primary text-primary-foreground rounded-tr-none'
                                        : 'bg-secondary/40 text-foreground rounded-tl-none border border-white/5 backdrop-blur-md'
                                        }`}
                                >
                                    {m.content}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start animate-pulse">
                                <div className="bg-secondary/20 p-4 rounded-[2rem] rounded-tl-none border border-white/5 flex items-center gap-3 backdrop-blur-sm">
                                    <div className="flex gap-1">
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Suggestions */}
                    {!isLoading && messages.length <= 2 && (
                        <div className="px-6 pb-4 flex flex-wrap gap-2">
                            {SUGGESTIONS.map((s, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSend(s.label)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 hover:bg-primary/20 border border-white/10 text-xs text-muted-foreground hover:text-foreground transition-all duration-300"
                                >
                                    {s.icon}
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input Area */}
                    <div className="p-6 bg-background/80 border-t border-white/10 backdrop-blur-xl">
                        <div className="relative flex items-center group">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Message Web3 Assistant..."
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 pr-14 transition-all group-hover:bg-white/10"
                            />
                            <button
                                onClick={() => handleSend()}
                                disabled={!input.trim() || isLoading}
                                className="absolute right-2 p-3 rounded-xl bg-primary shadow-lg shadow-primary/20 text-primary-foreground hover:scale-105 disabled:opacity-50 disabled:scale-100 transition-all active:scale-95"
                            >
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex justify-between items-center mt-4">
                            <p className="text-[9px] text-muted-foreground/30 uppercase tracking-[0.2em] font-bold">
                                DeFi OS • Alpha v1.0
                            </p>
                            <div className="flex items-center gap-2">
                                <Zap className="w-3 h-3 text-yellow-500/50" />
                                <span className="text-[9px] text-muted-foreground/40 font-mono italic">Not Financial Advice</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
