
import React, { useState, useEffect, useRef } from 'react';
import { AnalyzedHotspot } from '../types';
import { generateAnalystResponse, ChatMessage } from '../services/chatService';

interface AIAnalystChatProps {
    focusedHotspot: AnalyzedHotspot | null;
}

const AIAnalystChat: React.FC<AIAnalystChatProps> = ({ focusedHotspot }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: 'init-1',
            sender: 'agent',
            text: "Hello. I am your Wildfire Risk Analyst. Select a location on the map, and I can explain the specific environmental risks and safety factors.",
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom on new message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping, isOpen]);

    // React to location change
    useEffect(() => {
        if (focusedHotspot) {
            handleAgentMessage(`I see you've selected **${focusedHotspot.envData.locationName}**. I've analyzed the environmental data. What would you like to know about the wildfire risk here?`);
            setIsOpen(true); // Auto-open on selection for better UX
        }
    }, [focusedHotspot?.id]);

    const handleAgentMessage = (text: string) => {
        setIsTyping(true);
        setTimeout(() => {
            const newMessage: ChatMessage = {
                id: Date.now().toString(),
                sender: 'agent',
                text: text,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, newMessage]);
            setIsTyping(false);
        }, 1000 + Math.random() * 500); // Simulate "thinking" time
    };

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            sender: 'user',
            text: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');

        // Generate Response
        const responseText = generateAnalystResponse(input, focusedHotspot);
        handleAgentMessage(responseText);
    };

    // Helper to render markdown-like bolding
    const renderText = (text: string) => {
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="text-orange-400">{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };

    return (
        <div className={`fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none ${isOpen ? 'w-full md:w-[380px] pr-6 pb-6 md:pr-0 md:pb-0' : ''}`}>
             
             {/* Chat Window */}
            {isOpen && (
                <div className="pointer-events-auto w-[calc(100vw-3rem)] md:w-full mb-4 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-slide-up flex flex-col h-[500px] max-h-[70vh]">
                    {/* Header */}
                    <div className="p-4 bg-gradient-to-r from-slate-800 to-slate-900 border-b border-white/5 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                            <div>
                                <h3 className="text-sm font-bold text-white">AI Risk Analyst</h3>
                                <p className="text-[10px] text-slate-400">Powered by WildfireIntel</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsOpen(false)}
                            className="text-slate-400 hover:text-white transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-black/20">
                        {messages.map((msg) => (
                            <div 
                                key={msg.id} 
                                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                                    msg.sender === 'user' 
                                        ? 'bg-blue-600 text-white rounded-tr-none' 
                                        : 'bg-slate-800 text-slate-200 border border-white/5 rounded-tl-none'
                                }`}>
                                    <p className="whitespace-pre-wrap">{renderText(msg.text)}</p>
                                    <span className="text-[9px] opacity-50 mt-1 block text-right">
                                        {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-slate-800 p-3 rounded-2xl rounded-tl-none border border-white/5 flex gap-1">
                                    <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                                    <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                                    <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Suggestion Chips (if Agent just spoke and Context exists) */}
                    {!isTyping && messages[messages.length-1].sender === 'agent' && focusedHotspot && (
                        <div className="px-4 pb-2 flex gap-2 overflow-x-auto no-scrollbar">
                           {['Assessment', 'Weather Details', 'Safety Tips', 'Why is risk high?'].map(chip => (
                               <button 
                                key={chip}
                                onClick={() => { setInput(chip); handleSend({ preventDefault: () => {} } as React.FormEvent); }}
                                className="flex-shrink-0 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-full text-[10px] text-slate-300 transition-colors whitespace-nowrap"
                               >
                                   {chip}
                               </button>
                           ))}
                        </div>
                    )}

                    {/* Input */}
                    <form onSubmit={handleSend} className="p-4 bg-slate-900 border-t border-white/5 flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about wildfire risks..."
                            className="flex-1 bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-4 py-2 focus:outline-none focus:border-orange-500/50 transition-all placeholder-slate-500"
                        />
                        <button 
                            type="submit"
                            disabled={!input.trim() || isTyping}
                            className="p-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                            </svg>
                        </button>
                    </form>
                </div>
            )}

            {/* Toggle Button */}
            {!isOpen && (
                <button 
                    onClick={() => setIsOpen(true)}
                    className="pointer-events-auto group relative flex items-center justify-center w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-full shadow-2xl hover:scale-110 transition-transform duration-300"
                >
                    <div className="absolute inset-0 rounded-full bg-white/20 animate-ping opacity-20 group-hover:opacity-40"></div>
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    {focusedHotspot && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-slate-900"></span>
                        </span>
                    )}
                </button>
            )}
        </div>
    );
};

export default AIAnalystChat;
