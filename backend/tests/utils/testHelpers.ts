import { ProductionPlanOutput } from '../../src/services/geminiService.js';

export const mockProductionPlan: ProductionPlanOutput = {
  characterModel: {
    source: 'A brave knight with a red cape',
    action: 'Generate a cartoon character avatar based on the description'
  },
  storyAnalysis: {
    hero: 'Sir Brave',
    parentPrompt: 'Teach the importance of courage',
    coreLesson: 'True courage means facing your fears',
    villain: 'The Shadow Beast',
    characterArc: 'From scared to brave',
    characterPersona: 'A young knight who learns to be brave. Speaks with kindness and courage.'
  },
  episodeScript: {
    action: 'Create a 4-scene story',
    scenes: [
      {
        scene: 1,
        title: 'The Challenge',
        dialog: 'I must face this shadow beast, no matter how scary it looks!'
      },
      {
        scene: 2,
        title: 'The Fear',
        dialog: 'I feel scared, but I remember what I learned about courage.'
      },
      {
        scene: 3,
        title: 'The Courage',
        dialog: 'I will face my fear with courage and stand strong!'
      },
      {
        scene: 4,
        title: 'The Victory',
        dialog: 'I did it! I defeated the shadow beast with my courage!'
      }
    ]
  },
  staticKeyframes: {
    action: 'Generate 4 keyframes',
    keyframes: [
      {
        keyframe: 1,
        scene: 1,
        prompt: 'A brave knight facing a shadow beast'
      },
      {
        keyframe: 2,
        scene: 2,
        prompt: 'A brave knight looking worried'
      },
      {
        keyframe: 3,
        scene: 3,
        prompt: 'A brave knight standing tall'
      },
      {
        keyframe: 4,
        scene: 4,
        prompt: 'A brave knight victorious'
      }
    ]
  },
  videoGeneration: {
    action: 'Generate 4 video clips',
    clips: [
      {
        clip: 1,
        input: 'Static Keyframe #1',
        prompt: 'Knight approaches beast'
      },
      {
        clip: 2,
        input: 'Static Keyframe #2',
        prompt: 'Knight feels fear'
      },
      {
        clip: 3,
        input: 'Static Keyframe #3',
        prompt: 'Knight finds courage'
      },
      {
        clip: 4,
        input: 'Static Keyframe #4',
        prompt: 'Knight celebrates victory'
      }
    ]
  },
  postProcessing: {
    action: 'Compile all clips into final video'
  }
};

export const mockImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

export const mockGeneratedImage = `data:image/png;base64,${mockImageBase64}`;

export const mockVideoUrl = 'https://example.com/video/test.mp4?key=test';

export const createMockProductionPlanData = (overrides = {}) => ({
  drawingDesc: 'A brave knight with a red cape',
  parentPrompt: 'Teach the importance of courage',
  language: 'English',
  imageBase64: mockImageBase64,
  imageMimeType: 'image/png',
  userId: 'test-user-123',
  ...overrides
});

export const createMockChatMessage = (message: string, role: 'user' | 'model' = 'user') => ({
  role,
  text: message,
  timestamp: new Date()
});

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

