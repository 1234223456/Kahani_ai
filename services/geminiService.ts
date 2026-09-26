import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { ProductionPlan } from '../types';

if (!process.env.API_KEY) {
    console.warn("API_KEY environment variable not set. Using a placeholder. The app may not function correctly.");
}

const productionPlanSchema = {
    type: Type.OBJECT,
    properties: {
        characterModel: {
            type: Type.OBJECT,
            properties: {
                source: { type: Type.STRING },
                action: { type: Type.STRING }
            },
            required: ['source', 'action']
        },
        storyAnalysis: {
            type: Type.OBJECT,
            properties: {
                hero: { type: Type.STRING },
                parentPrompt: { type: Type.STRING },
                coreLesson: { type: Type.STRING },
                villain: { type: Type.STRING },
                characterArc: { type: Type.STRING },
                characterPersona: { type: Type.STRING, description: "A detailed persona for the hero character, to be used for chat and voice interactions. Should include personality, way of speaking, and core motivations." }
            },
            required: ['hero', 'parentPrompt', 'coreLesson', 'villain', 'characterArc', 'characterPersona']
        },
        episodeScript: {
            type: Type.OBJECT,
            properties: {
                action: { type: Type.STRING },
                scenes: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            scene: { type: Type.INTEGER },
                            title: { type: Type.STRING },
                            dialog: { type: Type.STRING, description: "The actual words the hero character speaks in this scene. Should be direct speech in first person, suitable for an 8-second video clip." }
                        },
                        required: ['scene', 'title', 'dialog']
                    }
                }
            },
            required: ['action', 'scenes']
        },
        staticKeyframes: {
            type: Type.OBJECT,
            properties: {
                action: { type: Type.STRING },
                keyframes: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            keyframe: { type: Type.INTEGER },
                            scene: { type: Type.INTEGER },
                            prompt: { type: Type.STRING }
                        },
                        required: ['keyframe', 'scene', 'prompt']
                    }
                }
            },
            required: ['action', 'keyframes']
        },
        videoGeneration: {
            type: Type.OBJECT,
            properties: {
                action: { type: Type.STRING },
                clips: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            clip: { type: Type.INTEGER },
                            input: { type: Type.STRING },
                            prompt: { type: Type.STRING }
                        },
                        required: ['clip', 'input', 'prompt']
                    }
                }
            },
            required: ['action', 'clips']
        },
        postProcessing: {
            type: Type.OBJECT,
            properties: {
                action: { type: Type.STRING }
            },
            required: ['action']
        }
    },
    required: ['characterModel', 'storyAnalysis', 'episodeScript', 'staticKeyframes', 'videoGeneration', 'postProcessing']
};

export const generateProductionPlan = async (drawing: string, parentPrompt: string, language: string, imageBase64: string | null, imageMimeType: string | null): Promise<ProductionPlan> => {
    const prompt = `
        You are Gemini 2.5 Pro, the 'Story Arc Engine' for a children's animation platform. Your task is to receive a child's drawing (as an image) and/or a text description, plus a parent's lesson, then output a complete Image-to-Video (I2V) production plan for a 32-second cartoon. The provided image of the drawing is the primary source of truth for the character's appearance.

        Your operation is governed by these strict constraints:
        1.  Total Length: Exactly 32 seconds.
        2.  Clip Structure: 4 (four) 8-second video clips.
        3.  Creative Structure: Every story must contain a Hero, a Villain, and a Character Arc.
        4.  I2V Workflow:
            - A 'gemini-2.5-flash-image' model is used to first create a master character avatar based on the user's drawing, and then to generate 4 static keyframes (one for each scene), placing the hero avatar into the scene.
            - A 'veo-3.1-fast-generate-preview' model is used in I2V mode to animate each of the 4 static keyframes for 8 seconds.
        5.  Visual Style: ALL images (character model and all keyframes) MUST be in 3D Disney Pixar animation style. This means: high quality 3D rendering, vibrant colors, smooth textures, expressive features, professional animation quality, similar to Disney/Pixar animated films like Toy Story, Finding Nemo, or Inside Out.
        6.  Consistency: The Hero's appearance (based on the input drawing) MUST be EXACTLY consistent across all clips. Use the FIRST character model image as the strict reference for all keyframes and videos. The character's appearance, clothing, colors, and features must remain identical.
        7.  Episode Script Requirements:
            - Each scene MUST have "dialog" (the actual words the hero character speaks).
            - The "dialog" field should contain direct speech that the character will say in the video, suitable for an 8-second clip.
            - Dialogs should be age-appropriate, engaging, and match the character's personality.
            - Each scene's dialog should be unique and specific to that scene's story moment.
        8.  Output: You MUST output a single, valid JSON object that strictly adheres to the provided schema. Do not include any text, markdown formatting, or explanations outside of the JSON object.

        Execute the following 6-step flow based on the inputs below. ALL generated text content (story, script, prompts, etc.) must be in the specified language.

        Language for all generated content: ${language}

        Inputs:
        [Drawing Description]: ${drawing}
        [Parent Prompt]: ${parentPrompt}
    `;

    const freshAi = new GoogleGenAI({ apiKey: process.env.API_KEY || " " });

    const parts: any[] = [];
    if (imageBase64 && imageMimeType) {
        parts.push({
            inlineData: {
                data: imageBase64,
                mimeType: imageMimeType
            }
        });
    }
    parts.push({text: prompt});


    const response = await freshAi.models.generateContent({
        model: "gemini-2.5-pro",
        contents: { parts: parts },
        config: {
            thinkingConfig: { thinkingBudget: 32768 },
            responseMimeType: "application/json",
            responseSchema: productionPlanSchema,
        },
    });

    const jsonString = response.text.trim();
    try {
        const parsedJson = JSON.parse(jsonString);
        return parsedJson as ProductionPlan;
    } catch (e) {
        console.error("Failed to parse JSON response:", jsonString);
        throw new Error("The AI returned an invalid story structure. Please try again.");
    }
};

// Helper to extract base64 data and mime type from a data URI
const dataUriToParts = (dataUri: string): { base64: string; mimeType: string } => {
    const [header, base64] = dataUri.split(',');
    const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';
    return { base64, mimeType };
};

export const generateImage = async (prompt: string, image?: { data: string, mimeType: string }): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || " " });

    const contentParts: any[] = [{ text: prompt }];
    if (image) {
        contentParts.unshift({
            inlineData: {
                data: image.data,
                mimeType: image.mimeType,
            },
        });
    }

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: contentParts },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
        }
    }

    throw new Error("Image generation failed to return an image.");
};

export const generateVideo = async (prompt: string, keyframeImageDataUri: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || " " });
    const { base64, mimeType } = dataUriToParts(keyframeImageDataUri);

    let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        image: {
            imageBytes: base64,
            mimeType: mimeType,
        },
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: '16:9'
        }
    });

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error("Video generation failed or did not return a valid link.");
    }
    
    const finalUrl = `${downloadLink}&key=${process.env.API_KEY}`;
    
    const videoResponse = await fetch(finalUrl);
    if (!videoResponse.ok) {
        throw new Error(`Failed to fetch video from generated URL. Status: ${videoResponse.statusText}`);
    }
    const videoBlob = await videoResponse.blob();
    return URL.createObjectURL(videoBlob);
};
