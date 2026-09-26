import { GoogleGenAI, Type, Modality } from "@google/genai";
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
// Get the directory of the current file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from the backend directory (go up from src/services to backend root)
dotenv.config({ path: join(__dirname, '../../.env') });

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
        characterPersona: { 
          type: Type.STRING, 
          description: "A detailed persona for the hero character, to be used for chat and voice interactions. Should include personality, way of speaking, and core motivations." 
        }
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

export interface ProductionPlanInput {
  drawing: string;
  parentPrompt: string;
  language: string;
  imageBase64?: string;
  imageMimeType?: string;
}

export interface ProductionPlanOutput {
  characterModel: {
    source: string;
    action: string;
  };
  storyAnalysis: {
    hero: string;
    parentPrompt: string;
    coreLesson: string;
    villain: string;
    characterArc: string;
    characterPersona: string;
  };
  episodeScript: {
    action: string;
    scenes: Array<{
      scene: number;
      title: string;
      dialog: string;
    }>;
  };
  staticKeyframes: {
    action: string;
    keyframes: Array<{
      keyframe: number;
      scene: number;
      prompt: string;
    }>;
  };
  videoGeneration: {
    action: string;
    clips: Array<{
      clip: number;
      input: string;
      prompt: string;
    }>;
  };
  postProcessing: {
    action: string;
  };
}

class GeminiService {
  private ai: GoogleGenAI;
  private apiKey: string;

  constructor() {
    // Debug: Check if env var is loaded
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey.trim() === "") {
      console.error("❌ GEMINI_API_KEY is not set!");
      console.error("Available env vars:", Object.keys(process.env).filter(k => k.includes('GEMINI') || k.includes('API')));
      throw new Error("GEMINI_API_KEY environment variable is required but not set. Please set it in your .env file in the backend directory.");
    }
    this.apiKey = apiKey;
    console.log("✅ Initializing Gemini with API key (length:", apiKey.length, ")");
    this.ai = new GoogleGenAI({ apiKey: this.apiKey });
  }

  async generateProductionPlan(input: ProductionPlanInput): Promise<ProductionPlanOutput> {
    const { drawing, parentPrompt, language, imageBase64, imageMimeType } = input;

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

    const parts: any[] = [];
    if (imageBase64 && imageMimeType) {
      parts.push({
        inlineData: {
          data: imageBase64,
          mimeType: imageMimeType
        }
      });
    }
    parts.push({ text: prompt });

    // Try gemini-2.5-pro first, fallback to gemini-1.5-pro if not available
    const models = ["gemini-2.5-pro", "gemini-1.5-pro", "gemini-pro"];
    let lastError: any = null;

    for (const model of models) {
      try {
        console.log(`🔄 Attempting to use model: ${model}`);
        const response = await this.ai.models.generateContent({
          model: model,
          contents: { parts: parts },
          config: {
            ...(model === "gemini-2.5-pro" && { thinkingConfig: { thinkingBudget: 32768 } }),
            responseMimeType: "application/json",
            responseSchema: productionPlanSchema,
          },
        });
        console.log(`✅ Successfully used model: ${model}`);
        return this.parseProductionPlanResponse(response);
      } catch (error: any) {
        console.warn(`⚠️ Model ${model} failed:`, error.message);
        lastError = error;
        // If it's a 403 or permission error, try next model
        if (error.status === 403 || error.message?.includes("PERMISSION_DENIED") || error.message?.includes("not found")) {
          continue;
        }
        // For other errors, throw immediately
        throw error;
      }
    }

    // If all models failed, throw the last error with helpful message
    throw new Error(
      `Failed to generate production plan with all available models. Last error: ${lastError?.message || "Unknown error"}. ` +
      `Please check that your API key has access to at least one of: ${models.join(", ")}. ` +
      `You may need to enable billing or request access to these models.`
    );

  }

  private parseProductionPlanResponse(response: any): ProductionPlanOutput {
    const jsonString = response.text?.trim();
    if (!jsonString) {
      throw new Error("The AI returned an empty response. Please try again.");
    }
    try {
      const parsedJson = JSON.parse(jsonString);
      return parsedJson as ProductionPlanOutput;
    } catch (e) {
      console.error("Failed to parse JSON response:", jsonString);
      throw new Error("The AI returned an invalid story structure. Please try again.");
    }
  }

  async generateImage(prompt: string, image?: { data: string; mimeType: string }): Promise<string> {
    const contentParts: any[] = [{ text: prompt }];
    if (image) {
      contentParts.unshift({
        inlineData: {
          data: image.data,
          mimeType: image.mimeType,
        },
      });
    }

    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: contentParts },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    if (!response.candidates || !response.candidates[0]?.content?.parts) {
      throw new Error("Image generation failed to return a valid response.");
    }

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData?.data) {
        const base64ImageBytes: string = part.inlineData.data;
        return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
      }
    }

    throw new Error("Image generation failed to return an image.");
  }

  async generateVideo(prompt: string, keyframeImageDataUri: string): Promise<string> {
    const { base64, mimeType } = this.dataUriToParts(keyframeImageDataUri);

    let operation = await this.ai.models.generateVideos({
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
      operation = await this.ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
      throw new Error("Video generation failed or did not return a valid link.");
    }

    // Return the download link with API key (will be handled by frontend or backend proxy)
    return `${downloadLink}&key=${this.apiKey}`;
  }

  // Helper to extract base64 data and mime type from a data URI
  private dataUriToParts(dataUri: string): { base64: string; mimeType: string } {
    const [header, base64] = dataUri.split(',');
    const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';
    return { base64, mimeType };
  }

  // Create a chat session
  createChatSession(persona: string) {
    return this.ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: `You are a character for a child. Your persona is: "${persona}". Keep your responses friendly, simple, and in character. Never break character.`,
      },
    });
  }
}

export default new GeminiService();
