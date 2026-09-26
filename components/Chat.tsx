
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat as GenAIChat } from "@google/genai";
import type { ChatMessage } from '../types';
import { PaperAirplaneIcon } from './icons/Icons';

interface ChatProps {
    persona: string;
    characterImage: string;
}

const Chat: React.FC<ChatProps> = ({ persona, characterImage }) => {
    const [chat, setChat] = useState<GenAIChat | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const initChat = () => {
             // A new instance is created here to ensure the latest API key from the dialog is used.
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || " "});
            const chatSession = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: `You are a character for a child. Your persona is: "${persona}". Keep your responses friendly, simple, and in character. Never break character.`,
                },
            });
            setChat(chatSession);
            setMessages([]);
        };
        initChat();
    }, [persona]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !chat || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setError(null);

        try {
            const stream = await chat.sendMessageStream({ message: input });
            
            let modelResponse = '';
            setMessages(prev => [...prev, { role: 'model', text: '' }]);

            for await (const chunk of stream) {
                modelResponse += chunk.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1].text = modelResponse;
                    return newMessages;
                });
            }
        } catch (e) {
             console.error(e);
             let errorMessage = "An error occurred while chatting.";
             if(e instanceof Error && e.message.includes("API key not valid")){
                errorMessage = "API key is not valid. Please select a valid key.";
             }
             setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[60vh] bg-gray-900/50 rounded-lg">
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-end gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                       {msg.role === 'model' && <img src={characterImage} alt="character" className="w-8 h-8 rounded-full"/>}
                        <div className={`max-w-xs md:max-w-md p-3 rounded-2xl ${msg.role === 'user' ? 'bg-purple-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}>
                           {msg.text}
                           {isLoading && msg.role === 'model' && index === messages.length - 1 && <span className="inline-block w-2 h-2 ml-1 bg-white rounded-full animate-pulse"></span>}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
                 {error && <p className="text-red-400 text-center">{error}</p>}
            </div>
            <form onSubmit={handleSend} className="p-4 border-t border-gray-700 flex items-center">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 bg-gray-700 border-none rounded-full py-2 px-4 focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400"
                    disabled={isLoading}
                />
                <button type="submit" disabled={isLoading || !input.trim()} className="ml-3 p-2 rounded-full bg-purple-600 text-white disabled:bg-gray-600 hover:bg-purple-700 transition-colors">
                    <PaperAirplaneIcon />
                </button>
            </form>
        </div>
    );
};

export default Chat;
