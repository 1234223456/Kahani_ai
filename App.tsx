import React, { useState, useEffect, useCallback } from 'react';
import type { ProductionPlan } from './types';
import { Language } from './types';
import Header from './components/Header';
import InputForm from './components/InputForm';
import ProductionPlanDisplay from './components/ProductionPlanDisplay';
import CharacterInteraction from './components/CharacterInteraction';
import apiService from './services/apiService';
import { combineVideos, downloadVideo } from './utils/videoCombiner';

// Backend API is now used - no need for API key selector

const App: React.FC = () => {
  const [drawingDesc, setDrawingDesc] = useState<string>('');
  const [parentPrompt, setParentPrompt] = useState<string>('');
  const [characterImage, setCharacterImage] = useState<string | null>(null);
  const [characterImageMimeType, setCharacterImageMimeType] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>(Language.ENGLISH);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [productionPlan, setProductionPlan] = useState<ProductionPlan | null>(null);

  // New state for generated assets and progress
  const [generationProgress, setGenerationProgress] = useState<string | null>(null);
  const [characterModelImage, setCharacterModelImage] = useState<string | null>(null);
  const [generatedKeyframes, setGeneratedKeyframes] = useState<(string | null)[]>([]);
  const [generatedVideos, setGeneratedVideos] = useState<(string | null)[]>([]);
  const [finalCombinedVideo, setFinalCombinedVideo] = useState<string | null>(null);
  const [isCombiningVideos, setIsCombiningVideos] = useState<boolean>(false);

  const handleGenerate = async () => {
    if (!drawingDesc && !characterImage) {
      setError("Please describe your character or upload an image.");
      return;
    }
     if (!parentPrompt) {
      setError("Please fill in the parent's lesson.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setProductionPlan(null);
    setGenerationProgress("Generating production plan...");
    setCharacterModelImage(null);
    setGeneratedKeyframes([]);
    setGeneratedVideos([]);

    try {
      // 1. Generate Production Plan using backend API
      const imageBase64 = characterImage ? characterImage.split(',')[1] : null;
      const result = await apiService.generateProductionPlan(
        drawingDesc, 
        parentPrompt, 
        language, 
        imageBase64, 
        characterImageMimeType
      );
      const plan = result as unknown as ProductionPlan;
      setProductionPlan(plan);
      setGeneratedKeyframes(new Array(plan.staticKeyframes.keyframes.length).fill(null));
      setGeneratedVideos(new Array(plan.videoGeneration.clips.length).fill(null));

      // 2. Generate Character Model using backend API
      setGenerationProgress("Generating character model...");
      const userImageForGeneration = characterImage ? { data: characterImage.split(',')[1], mimeType: characterImageMimeType! } : undefined;
      const characterPrompt = `${plan.characterModel.action}. The character should be based on this description: "${plan.characterModel.source}". Style: 3D Disney Pixar animation style, high quality, vibrant colors, smooth textures, expressive features, professional animation quality.`;
      const charModelImgResult = await apiService.generateImage(characterPrompt, userImageForGeneration);
      const charModelImg = charModelImgResult.image;
      setCharacterModelImage(charModelImg);

      // 3. Generate Keyframes sequentially using backend API
      // Use the FIRST character model image strictly for all keyframes to ensure consistency
      const allKeyframes: string[] = [];
      const charModelImgParts = { data: charModelImg.split(',')[1], mimeType: charModelImg.match(/:(.*?);/)?.[1]! };
      for (const [index, kf] of plan.staticKeyframes.keyframes.entries()) {
          setGenerationProgress(`Generating keyframe ${index + 1}/${plan.staticKeyframes.keyframes.length}...`);
          // Always use the first character model image for strict consistency
          const keyframePrompt = `${kf.prompt}. Style: 3D Disney Pixar animation style, high quality, vibrant colors, smooth textures, expressive features, professional animation quality. Maintain EXACT character appearance consistency with the first character model image. The character's appearance, clothing, colors, and features must be identical to the character model.`;
          const keyframeResult = await apiService.generateImage(keyframePrompt, charModelImgParts);
          const keyframeImg = keyframeResult.image;
          setGeneratedKeyframes(prev => {
              const newKeyframes = [...prev];
              newKeyframes[index] = keyframeImg;
              return newKeyframes;
          });
          allKeyframes.push(keyframeImg);
      }

      // 4. Generate Videos sequentially using backend API with character dialog
      for (const [index, clip] of plan.videoGeneration.clips.entries()) {
          setGenerationProgress(`Animating clip ${index + 1}/${plan.videoGeneration.clips.length}...`);
          // The clip input is "Static Keyframe #1", so we extract the index.
          const keyframeIndex = parseInt(clip.input.split('#')[1] || '1') - 1;
          const keyframeForVideo = allKeyframes[keyframeIndex];

          // Match clip to scene by clip number (clips are 1-indexed, so clip.clip - 1 = scene index)
          // Ensure we use the correct scene for this clip, not just the keyframe index
          const sceneIndex = clip.clip - 1; // clip.clip is 1-indexed, convert to 0-indexed
          const correspondingScene = plan.episodeScript.scenes[sceneIndex];
          
          // Use dialog (what character speaks)
          const sceneDialog = correspondingScene ? correspondingScene.dialog : '';
          
          // Enhanced prompt with character dialog - use first character model image for strict consistency
          const enhancedPrompt = `${clip.prompt}. The character ${plan.storyAnalysis.hero} is speaking: "${sceneDialog}". Show expressive mouth movements and gestures that match the dialog. Maintain EXACT character appearance consistency with the first character model image.`;

          const videoResult = await apiService.generateVideo(enhancedPrompt, keyframeForVideo);
          const videoUrl = videoResult.videoUrl;
           setGeneratedVideos(prev => {
              const newVideos = [...prev];
              newVideos[index] = videoUrl;
              return newVideos;
          });
      }

      setGenerationProgress("Your story is complete!");
      
      // Automatically combine videos when all are generated
      if (plan.videoGeneration.clips.length === generatedVideos.filter(v => v !== null).length) {
        // Videos will be combined when user clicks the combine button
      }

    } catch (e) {
      console.error(e);
      let errorMessage = "An unknown error occurred during generation.";
      if (e instanceof Error) {
        errorMessage = e.message;
      }
      setError(errorMessage);
      setGenerationProgress(null);
    } finally {
      setIsLoading(false);
      setTimeout(() => setGenerationProgress(null), 5000);
    }
  };

  const handleCombineVideos = async () => {
    if (generatedVideos.length === 0 || generatedVideos.some(v => !v)) {
      setError("Please wait for all videos to be generated first.");
      return;
    }

    setIsCombiningVideos(true);
    setGenerationProgress("Combining videos into final story...");
    
    try {
      const validVideos = generatedVideos.filter(v => v !== null) as string[];
      const combinedVideoUrl = await combineVideos(validVideos);
      setFinalCombinedVideo(combinedVideoUrl);
      setGenerationProgress("Videos combined successfully!");
      setTimeout(() => setGenerationProgress(null), 3000);
    } catch (error) {
      console.error('Error combining videos:', error);
      setError(error instanceof Error ? error.message : "Failed to combine videos. Please try again.");
      setGenerationProgress(null);
    } finally {
      setIsCombiningVideos(false);
    }
  };

  const handleDownloadVideo = (videoUrl: string, filename: string) => {
    try {
      downloadVideo(videoUrl, filename);
    } catch (error) {
      console.error('Error downloading video:', error);
      setError("Failed to download video. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <main className="container mx-auto px-4 py-8">
        <Header />
        
        <div className="max-w-4xl mx-auto bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl shadow-purple-500/10 p-6 md:p-10 border border-gray-700">
          <InputForm
            drawingDesc={drawingDesc}
            setDrawingDesc={setDrawingDesc}
            parentPrompt={parentPrompt}
            setParentPrompt={setParentPrompt}
            language={language}
            setLanguage={setLanguage}
            onGenerate={handleGenerate}
            isLoading={isLoading}
            hasVeoApiKey={true}
            characterImage={characterImage}
            setCharacterImage={setCharacterImage}
            setCharacterImageMimeType={setCharacterImageMimeType}
          />

          {isLoading && (
            <div className="text-center my-8">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
              <p className="mt-4 text-lg text-purple-300">{generationProgress || 'Generating...'}</p>
            </div>
          )}

          {error && (
            <div className="my-6 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-300 text-center">
              <p className="font-bold">Error</p>
              <p>{error}</p>
            </div>
          )}
        </div>

        {productionPlan && (
          <div className="mt-12">
            <ProductionPlanDisplay 
                plan={productionPlan} 
                characterModelImage={characterModelImage}
                generatedKeyframes={generatedKeyframes}
                generatedVideos={generatedVideos}
                finalCombinedVideo={finalCombinedVideo}
                isCombiningVideos={isCombiningVideos}
                onCombineVideos={handleCombineVideos}
                onDownloadVideo={handleDownloadVideo}
            />
            <CharacterInteraction 
              persona={productionPlan.storyAnalysis.characterPersona} 
              characterImage={characterModelImage || `https://picsum.photos/seed/${productionPlan.characterModel.source.replace(/\s/g, '')}/512`}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;