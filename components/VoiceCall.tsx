
import React, { useState, useRef, useCallback, useEffect } from 'react';
// FIX: Removed non-exported member `LiveSession` from import.
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from "@google/genai";
import { PhoneIcon, StopCircleIcon } from './icons/Icons';

interface VoiceCallProps {
    persona: string;
    characterImage: string;
}

// Audio encoding/decoding helpers
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length;
  const buffer = ctx.createBuffer(1, frameCount, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
}

function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

const VoiceCall: React.FC<VoiceCallProps> = ({ persona, characterImage }) => {
    const [isCalling, setIsCalling] = useState(false);
    const [status, setStatus] = useState('Idle');
    const [error, setError] = useState<string | null>(null);

    // FIX: Changed type annotation from `LiveSession` to `any` as `LiveSession` is not exported.
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    
    const startCall = async () => {
        setIsCalling(true);
        setStatus('Connecting...');
        setError(null);

        try {
            // A new instance is created here to ensure the latest API key from the dialog is used.
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || " "});

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            audioContextRef.current = inputAudioContext;
            
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            let nextStartTime = 0;

            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                    systemInstruction: `You are a character for a child. Your persona is: "${persona}". Keep your responses friendly, simple, and in character. Never break character.`,
                },
                callbacks: {
                    onopen: () => {
                        setStatus('Connected. Speak now!');
                        const source = inputAudioContext.createMediaStreamSource(stream);
                        mediaStreamSourceRef.current = source;

                        const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current = scriptProcessor;

                        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const l = inputData.length;
                            const int16 = new Int16Array(l);
                            for (let i = 0; i < l; i++) {
                                int16[i] = inputData[i] * 32768;
                            }
                            const pcmBlob: Blob = {
                                data: encode(new Uint8Array(int16.buffer)),
                                mimeType: 'audio/pcm;rate=16000',
                            };
                            
                            if(sessionPromiseRef.current){
                                sessionPromiseRef.current.then((session) => {
                                    session.sendRealtimeInput({ media: pcmBlob });
                                });
                            }
                        };

                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputAudioContext.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64Audio && outputAudioContextRef.current) {
                            nextStartTime = Math.max(nextStartTime, outputAudioContextRef.current.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContextRef.current);
                            const source = outputAudioContextRef.current.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputAudioContextRef.current.destination);
                            source.start(nextStartTime);
                            nextStartTime += audioBuffer.duration;
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Live API Error:', e);
                        setError('A connection error occurred.');
                        stopCall();
                    },
                    onclose: () => {
                       if (isCalling) { // Only set status if call was not manually stopped
                          setStatus('Call ended.');
                          stopCall();
                       }
                    },
                },
            });

        } catch (err) {
            console.error(err);
             let errorMessage = "Failed to start call.";
             if(err instanceof Error && err.message.includes("API key not valid")){
                errorMessage = "API key is not valid. Please select a valid key.";
             }
            setError(errorMessage);
            stopCall();
        }
    };

    const stopCall = useCallback(() => {
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => session.close());
            sessionPromiseRef.current = null;
        }

        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        
        if(mediaStreamSourceRef.current){
            mediaStreamSourceRef.current.disconnect();
            mediaStreamSourceRef.current = null;
        }

        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
            outputAudioContextRef.current.close();
            outputAudioContextRef.current = null;
        }

        setIsCalling(false);
        setStatus('Idle');
    }, []);

    // FIX: Added useEffect import because it's used here.
    useEffect(() => {
        // Cleanup on component unmount
        return () => {
            stopCall();
        };
    }, [stopCall]);

    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center bg-gray-900/50 rounded-lg p-6">
            <img src={characterImage} alt="character" className="w-32 h-32 rounded-full mb-4 border-4 border-purple-500 shadow-lg"/>
            <p className="font-bold text-xl text-purple-300 mb-2">{status}</p>
            {error && <p className="text-red-400 mb-4">{error}</p>}
            
            {!isCalling ? (
                <button onClick={startCall} className="px-8 py-4 bg-green-600 text-white font-bold rounded-full hover:bg-green-700 transition-colors flex items-center space-x-2">
                    <PhoneIcon />
                    <span>Start Voice Call</span>
                </button>
            ) : (
                <button onClick={stopCall} className="px-8 py-4 bg-red-600 text-white font-bold rounded-full hover:bg-red-700 transition-colors flex items-center space-x-2">
                    <StopCircleIcon />
                    <span>End Call</span>
                </button>
            )}
        </div>
    );
};

export default VoiceCall;