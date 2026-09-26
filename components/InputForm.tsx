
import React, { useState, useRef, useEffect } from 'react';
import type { Language } from '../types';
import { Language as LanguageEnum } from '../types';
import { PhotoIcon, XMarkIcon, CameraIcon } from './icons/Icons';

interface InputFormProps {
    drawingDesc: string;
    setDrawingDesc: (value: string) => void;
    parentPrompt: string;
    setParentPrompt: (value: string) => void;
    language: Language;
    setLanguage: (value: Language) => void;
    onGenerate: () => void;
    isLoading: boolean;
    hasVeoApiKey: boolean;
    characterImage: string | null;
    setCharacterImage: (value: string | null) => void;
    setCharacterImageMimeType: (value: string | null) => void;
}

const InputForm: React.FC<InputFormProps> = ({
    drawingDesc,
    setDrawingDesc,
    parentPrompt,
    setParentPrompt,
    language,
    setLanguage,
    onGenerate,
    isLoading,
    hasVeoApiKey,
    characterImage,
    setCharacterImage,
    setCharacterImageMimeType
}) => {

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                const mimeType = result.match(/:(.*?);/)?.[1];
                if (mimeType) {
                    setCharacterImage(result);
                    setCharacterImageMimeType(mimeType);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setCharacterImage(null);
        setCharacterImageMimeType(null);
    };

    // Camera capture state
    const [showCamera, setShowCamera] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [cameraReady, setCameraReady] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Clean up camera stream when component unmounts or camera closes
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
        };
    }, []);

    const startCamera = async () => {
        try {
            setCameraError(null);
            setCameraReady(false);
            setShowCamera(true); // Show modal first so video element is mounted
            
            // Wait a bit for the video element to be available
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment', // Use back camera if available
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                } 
            });
            streamRef.current = stream;
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                // Ensure video plays
                videoRef.current.onloadedmetadata = () => {
                    if (videoRef.current) {
                        videoRef.current.play()
                            .then(() => {
                                setCameraReady(true);
                            })
                            .catch(err => {
                                console.error('Error playing video:', err);
                                setCameraError('Failed to start camera preview.');
                            });
                    }
                };
            }
        } catch (error) {
            console.error('Error accessing camera:', error);
            setCameraError('Unable to access camera. Please check permissions or try uploading an image instead.');
            setShowCamera(false); // Hide modal on error
            setCameraReady(false);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setShowCamera(false);
        setCameraError(null);
        setCameraReady(false);
    };

    const capturePhoto = () => {
        if (videoRef.current) {
            const video = videoRef.current;
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0);
                const dataURL = canvas.toDataURL('image/jpeg', 0.9);
                setCharacterImage(dataURL);
                setCharacterImageMimeType('image/jpeg');
                stopCamera();
            }
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-purple-300 mb-2">
                    Your Character
                </label>
                <div className="mt-2 bg-gray-900 border border-gray-600 rounded-lg p-4 space-y-4">
                    {characterImage ? (
                        <div className="relative group">
                            <img src={characterImage} alt="Character preview" className="rounded-lg w-full max-h-60 object-contain" />
                            <button
                                onClick={removeImage}
                                className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                                aria-label="Remove image"
                            >
                                <XMarkIcon />
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="flex gap-3">
                        <div
                                    className="relative flex-1 border-2 border-gray-500 border-dashed rounded-lg p-6 text-center hover:border-purple-400 transition-colors cursor-pointer"
                                    onClick={() => document.getElementById('file-input')?.click()}
                        >
                            <div className="flex flex-col items-center justify-center">
                                <PhotoIcon />
                                <span className="mt-2 block text-sm font-semibold text-gray-400">
                                    Upload a drawing
                                </span>
                            </div>
                            <input
                                        id="file-input"
                                type="file"
                                        className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                                aria-label="Upload character drawing"
                            />
                        </div>
                                <button
                                    type="button"
                                    onClick={startCamera}
                                    className="flex-1 border-2 border-gray-500 border-dashed rounded-lg p-6 text-center hover:border-purple-400 transition-colors flex flex-col items-center justify-center"
                                >
                                    <CameraIcon />
                                    <span className="mt-2 block text-sm font-semibold text-gray-400">
                                        Take a photo
                                    </span>
                                </button>
                            </div>
                            
                            {cameraError && (
                                <div className="p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-300 text-sm">
                                    {cameraError}
                                </div>
                            )}

                            {showCamera && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
                                    <div className="bg-gray-900 rounded-lg p-6 max-w-2xl w-full">
                                        <div className="relative bg-black rounded-lg overflow-hidden">
                                            <video
                                                ref={videoRef}
                                                autoPlay
                                                playsInline
                                                muted
                                                className="w-full rounded-lg"
                                                style={{ maxHeight: '70vh', display: 'block' }}
                                                onLoadedMetadata={() => {
                                                    if (videoRef.current) {
                                                        videoRef.current.play().catch(err => {
                                                            console.error('Error playing video:', err);
                                                        });
                                                    }
                                                }}
                                            />
                                            {!cameraReady && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                                                    <div className="text-center">
                                                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
                                                        <p className="mt-4 text-purple-300">Starting camera...</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-4 mt-4 justify-center">
                                            <button
                                                type="button"
                                                onClick={capturePhoto}
                                                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all"
                                            >
                                                Capture Photo
                                            </button>
                                            <button
                                                type="button"
                                                onClick={stopCamera}
                                                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-all"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                    
                    <div>
                         <label htmlFor="drawing-desc" className="sr-only">
                            Add more details about your character...
                        </label>
                        <textarea
                            id="drawing-desc"
                            rows={2}
                            className="w-full bg-gray-800 border-0 rounded-md p-2 focus:ring-2 focus:ring-purple-500 transition-all placeholder-gray-500 text-sm"
                            placeholder="Add more details about your character (optional)..."
                            value={drawingDesc}
                            onChange={(e) => setDrawingDesc(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div>
                <label htmlFor="parent-prompt" className="block text-sm font-medium text-purple-300 mb-2">
                    Parent's Lesson or Theme
                </label>
                <input
                    type="text"
                    id="parent-prompt"
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all placeholder-gray-500"
                    placeholder="e.g., It's important to clean up your toys."
                    value={parentPrompt}
                    onChange={(e) => setParentPrompt(e.target.value)}
                />
            </div>

            <div>
                <label htmlFor="language" className="block text-sm font-medium text-purple-300 mb-2">
                    Language
                </label>
                <select
                    id="language"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as Language)}
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                >
                    <option value={LanguageEnum.ENGLISH}>English</option>
                    <option value={LanguageEnum.HINDI}>Hindi</option>
                </select>
            </div>
            
            <div className="text-center pt-4">
                <button
                    onClick={onGenerate}
                    disabled={isLoading || !hasVeoApiKey}
                    className="w-full md:w-auto px-12 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-full hover:scale-105 transform transition-transform duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 shadow-lg shadow-purple-500/30"
                >
                    {isLoading ? 'Creating Magic...' : 'Generate Story'}
                </button>
                 {!hasVeoApiKey && <p className="text-sm text-yellow-400 mt-3">Please select a Veo API key below to enable generation.</p>}
            </div>
        </div>
    );
};

export default InputForm;
