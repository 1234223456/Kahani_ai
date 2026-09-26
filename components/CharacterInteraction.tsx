
import React, { useState } from 'react';
import Chat from './Chat';
import VoiceCall from './VoiceCall';
import { ChatBubbleLeftIcon, PhoneIcon } from './icons/Icons';

interface CharacterInteractionProps {
    persona: string;
    characterImage: string;
}

type Tab = 'chat' | 'voice';

const CharacterInteraction: React.FC<CharacterInteractionProps> = ({ persona, characterImage }) => {
    const [activeTab, setActiveTab] = useState<Tab>('chat');

    return (
        <div className="mt-12 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-8">Interact with Your Character!</h2>
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl shadow-lg overflow-hidden">
                <div className="flex border-b border-gray-700">
                    <button
                        onClick={() => setActiveTab('chat')}
                        className={`flex-1 p-4 font-semibold flex items-center justify-center space-x-2 transition-colors ${activeTab === 'chat' ? 'bg-purple-600 text-white' : 'bg-gray-900/50 text-gray-400 hover:bg-gray-700'}`}
                    >
                        <ChatBubbleLeftIcon />
                        <span>Chat</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('voice')}
                        className={`flex-1 p-4 font-semibold flex items-center justify-center space-x-2 transition-colors ${activeTab === 'voice' ? 'bg-purple-600 text-white' : 'bg-gray-900/50 text-gray-400 hover:bg-gray-700'}`}
                    >
                       <PhoneIcon />
                       <span>Voice Call</span>
                    </button>
                </div>
                <div className="p-2 md:p-6">
                    {activeTab === 'chat' ? <Chat persona={persona} characterImage={characterImage}/> : <VoiceCall persona={persona} characterImage={characterImage} />}
                </div>
            </div>
        </div>
    );
};

export default CharacterInteraction;
