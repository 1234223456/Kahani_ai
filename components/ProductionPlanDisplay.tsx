import React from 'react';
import type { ProductionPlan } from '../types';
import { CheckCircleIcon, FilmIcon, CameraIcon, SparklesIcon, BookOpenIcon, UserCircleIcon } from './icons/Icons';

interface ProductionPlanDisplayProps {
    plan: ProductionPlan;
    characterModelImage: string | null;
    generatedKeyframes: (string | null)[];
    generatedVideos: (string | null)[];
    finalCombinedVideo: string | null;
    isCombiningVideos: boolean;
    onCombineVideos: () => void;
    onDownloadVideo: (videoUrl: string, filename: string) => void;
}

const SectionCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl shadow-lg overflow-hidden">
        <div className="p-4 bg-gray-900/50 flex items-center space-x-3 border-b border-gray-700">
            <div className="text-purple-400">{icon}</div>
            <h3 className="text-xl font-bold text-purple-300">{title}</h3>
        </div>
        <div className="p-6 text-gray-300 space-y-4">{children}</div>
    </div>
);

const LoadingSpinner: React.FC = () => (
    <div className="w-full h-full bg-black rounded-md flex items-center justify-center text-purple-500">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
    </div>
);

const ProductionPlanDisplay: React.FC<ProductionPlanDisplayProps> = ({ 
    plan, 
    characterModelImage, 
    generatedKeyframes, 
    generatedVideos,
    finalCombinedVideo,
    isCombiningVideos,
    onCombineVideos,
    onDownloadVideo
}) => {
    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-8">Your Production Plan</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <SectionCard title="1. Character Model Generation" icon={<UserCircleIcon />}>
                    <p className="text-gray-400">{plan.characterModel.action}</p>
                    <p><strong className="text-purple-400">Source:</strong> {plan.characterModel.source}</p>
                     <div className="w-full h-64 object-cover rounded-lg mt-2">
                        {characterModelImage ? (
                            <img src={characterModelImage} alt="Character Model" className="w-full h-full object-cover rounded-lg"/>
                        ) : (
                            <LoadingSpinner />
                        )}
                     </div>
                </SectionCard>

                <SectionCard title="2. Story & Arc Analysis" icon={<SparklesIcon />}>
                    <p><strong className="text-purple-400">Hero:</strong> {plan.storyAnalysis.hero}</p>
                    <p><strong className="text-purple-400">Villain:</strong> {plan.storyAnalysis.villain}</p>
                    <p><strong className="text-purple-400">Core Lesson:</strong> {plan.storyAnalysis.coreLesson}</p>
                    <p className="text-gray-400 italic">"{plan.storyAnalysis.characterArc}"</p>
                </SectionCard>
            </div>
            
            <SectionCard title="3. Episode Script" icon={<BookOpenIcon />}>
                <p className="text-gray-400">{plan.episodeScript.action}</p>
                <div className="space-y-4 mt-4 max-h-96 overflow-y-auto pr-2">
                    {plan.episodeScript.scenes.map(scene => (
                        <div key={scene.scene} className="p-4 bg-gray-900/70 rounded-lg">
                            <h4 className="font-semibold text-purple-400">{scene.title} (Scene {scene.scene})</h4>
                            <p className="text-purple-300 font-medium">Character says: <span className="text-white">"{scene.dialog}"</span></p>
                        </div>
                    ))}
                </div>
            </SectionCard>

            <SectionCard title="4. Static Keyframe Generation" icon={<CameraIcon />}>
                 <p className="text-gray-400">{plan.staticKeyframes.action}</p>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                     {plan.staticKeyframes.keyframes.map((kf, index) => (
                         <div key={kf.keyframe} className="bg-gray-900/70 p-3 rounded-lg">
                             <div className="w-full h-40 rounded-md mb-2">
                                 {generatedKeyframes[index] ? (
                                     <img src={generatedKeyframes[index]!} alt={`Keyframe ${kf.keyframe}`} className="w-full h-full object-cover rounded-md"/>
                                 ) : (
                                     <LoadingSpinner />
                                 )}
                             </div>
                             <p className="text-xs text-gray-400"><strong className="text-purple-400">Keyframe {kf.keyframe}:</strong> {kf.prompt}</p>
                         </div>
                     ))}
                 </div>
            </SectionCard>

            <SectionCard title="5. Video Generation (Veo 3)" icon={<FilmIcon />}>
                <p className="text-gray-400">{plan.videoGeneration.action}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                     {plan.videoGeneration.clips.map((clip, index) => (
                         <div key={clip.clip} className="bg-gray-900/70 p-3 rounded-lg">
                             <div className="w-full h-40 bg-black rounded-md mb-2">
                                {generatedVideos[index] ? (
                                    <video src={generatedVideos[index]!} controls autoPlay loop muted className="w-full h-full object-cover rounded-md"></video>
                                ) : (
                                    <LoadingSpinner />
                                )}
                             </div>
                             <p className="text-xs text-gray-400"><strong className="text-purple-400">Clip {clip.clip}:</strong> {clip.prompt}</p>
                         </div>
                     ))}
                 </div>
            </SectionCard>

            <SectionCard title="6. Final Combined Video" icon={<FilmIcon />}>
                <p className="text-gray-400 mb-4">Combine all 4 video clips into one complete story</p>
                
                {!finalCombinedVideo && (
                    <div className="flex flex-col items-center space-y-4">
                        <button
                            onClick={onCombineVideos}
                            disabled={isCombiningVideos || generatedVideos.some(v => !v)}
                            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                                isCombiningVideos || generatedVideos.some(v => !v)
                                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                            }`}
                        >
                            {isCombiningVideos ? 'Combining Videos...' : 'Combine All Videos'}
                        </button>
                        {generatedVideos.some(v => !v) && (
                            <p className="text-sm text-gray-500">Please wait for all videos to be generated first</p>
                        )}
                    </div>
                )}

                {finalCombinedVideo && (
                    <div className="space-y-4">
                        <div className="w-full bg-black rounded-lg overflow-hidden">
                            <video 
                                src={finalCombinedVideo} 
                                controls 
                                className="w-full h-auto max-h-96"
                                autoPlay
                                loop
                            >
                                Your browser does not support the video tag.
                            </video>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={() => onDownloadVideo(finalCombinedVideo, `${plan.storyAnalysis.hero}-complete-story.webm`)}
                                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all"
                            >
                                Download Final Video
                            </button>
                            <button
                                onClick={() => {
                                    generatedVideos.forEach((video, index) => {
                                        if (video) {
                                            setTimeout(() => {
                                                onDownloadVideo(video, `${plan.storyAnalysis.hero}-clip-${index + 1}.webm`);
                                            }, index * 200);
                                        }
                                    });
                                }}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all"
                            >
                                Download All Clips
                            </button>
                        </div>
                    </div>
                )}
            </SectionCard>

            <SectionCard title="7. Post-Processing & Audio" icon={<CheckCircleIcon />}>
                <p>{plan.postProcessing.action}</p>
            </SectionCard>
        </div>
    );
};

export default ProductionPlanDisplay;