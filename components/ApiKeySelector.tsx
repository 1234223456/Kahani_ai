
import React, { useCallback } from 'react';

interface ApiKeySelectorProps {
    hasKey: boolean;
    setHasKey: (hasKey: boolean) => void;
}

const ApiKeySelector: React.FC<ApiKeySelectorProps> = ({ hasKey, setHasKey }) => {
    
    const handleSelectKey = useCallback(async () => {
        try {
            await (window as any).aistudio.openSelectKey();
            // Assume success after dialog opens to handle race condition
            setHasKey(true); 
        } catch (e) {
            console.error("Error opening API key selector:", e);
        }
    }, [setHasKey]);

    return (
        <div className="mt-6 p-4 bg-gray-900/50 border border-gray-700 rounded-lg text-center">
            <h4 className="font-semibold text-gray-300">Veo Video Generation</h4>
            <p className="text-sm text-gray-400 mt-1">
                Video generation requires an API key with access to Veo models.
                For more info, see the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">billing documentation</a>.
            </p>
            <div className="mt-4">
                <p className="text-sm mb-2">
                    Status: {hasKey 
                        ? <span className="text-green-400 font-bold">API Key Selected</span> 
                        : <span className="text-yellow-400 font-bold">No API Key Selected</span>}
                </p>
                <button
                    onClick={handleSelectKey}
                    className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 transition-colors"
                >
                    {hasKey ? 'Change API Key' : 'Select API Key'}
                </button>
            </div>
        </div>
    );
};

export default ApiKeySelector;
