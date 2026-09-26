import ProductionPlan from '../../../src/models/ProductionPlan.js';

describe('ProductionPlan Model Unit Tests', () => {
  describe('Model Validation', () => {
    it('should create a valid production plan', async () => {
      const validPlan = new ProductionPlan({
        characterModel: {
          source: 'A brave knight',
          action: 'Generate character'
        },
        storyAnalysis: {
          hero: 'Sir Brave',
          parentPrompt: 'Teach courage',
          coreLesson: 'Be brave',
          villain: 'Shadow Beast',
          characterArc: 'From scared to brave',
          characterPersona: 'A friendly knight'
        },
        episodeScript: {
          action: 'Create script',
          scenes: [
            { scene: 1, title: 'Scene 1', dialog: 'Test dialog' }
          ]
        },
        staticKeyframes: {
          action: 'Generate keyframes',
          keyframes: [
            { keyframe: 1, scene: 1, prompt: 'Test prompt' }
          ]
        },
        videoGeneration: {
          action: 'Generate videos',
          clips: [
            { clip: 1, input: 'Keyframe 1', prompt: 'Test prompt' }
          ]
        },
        postProcessing: {
          action: 'Compile video'
        },
        language: 'English',
        drawingDescription: 'A brave knight',
        parentPrompt: 'Teach courage'
      });

      const savedPlan = await validPlan.save();
      expect(savedPlan._id).toBeDefined();
      expect(savedPlan.characterModel.source).toBe('A brave knight');
      expect(savedPlan.createdAt).toBeDefined();
      expect(savedPlan.updatedAt).toBeDefined();
    });

    it('should fail without required fields', async () => {
      const invalidPlan = new ProductionPlan({
        characterModel: {
          source: 'Test'
        }
        // Missing required fields
      });

      await expect(invalidPlan.save()).rejects.toThrow();
    });

    it('should set default language to English', async () => {
      const plan = new ProductionPlan({
        characterModel: { source: 'Test', action: 'Test' },
        storyAnalysis: {
          hero: 'Hero',
          parentPrompt: 'Prompt',
          coreLesson: 'Lesson',
          villain: 'Villain',
          characterArc: 'Arc',
          characterPersona: 'Persona'
        },
        episodeScript: { action: 'Test', scenes: [] },
        staticKeyframes: { action: 'Test', keyframes: [] },
        videoGeneration: { action: 'Test', clips: [] },
        postProcessing: { action: 'Test' },
        drawingDescription: 'Test',
        parentPrompt: 'Test'
        // language not specified
      });

      const savedPlan = await plan.save();
      expect(savedPlan.language).toBe('English');
    });

    it('should store generated assets', async () => {
      const plan = new ProductionPlan({
        characterModel: { source: 'Test', action: 'Test' },
        storyAnalysis: {
          hero: 'Hero',
          parentPrompt: 'Prompt',
          coreLesson: 'Lesson',
          villain: 'Villain',
          characterArc: 'Arc',
          characterPersona: 'Persona'
        },
        episodeScript: { action: 'Test', scenes: [] },
        staticKeyframes: { action: 'Test', keyframes: [] },
        videoGeneration: { action: 'Test', clips: [] },
        postProcessing: { action: 'Test' },
        language: 'English',
        drawingDescription: 'Test',
        parentPrompt: 'Test',
        generatedAssets: {
          characterModelImage: 'data:image/png;base64,test',
          keyframeImages: ['kf1', 'kf2'],
          videoUrls: ['video1', 'video2']
        }
      });

      const savedPlan = await plan.save();
      expect(savedPlan.generatedAssets?.characterModelImage).toBe('data:image/png;base64,test');
      expect(savedPlan.generatedAssets?.keyframeImages).toHaveLength(2);
      expect(savedPlan.generatedAssets?.videoUrls).toHaveLength(2);
    });

    it('should index userId for fast queries', async () => {
      const indexes = ProductionPlan.schema.indexes();
      const userIdIndex = indexes.find((idx: any) => idx[0].userId === 1);
      expect(userIdIndex).toBeDefined();
    });
  });

  describe('Scenes Validation', () => {
    it('should validate scene structure', async () => {
      const plan = new ProductionPlan({
        characterModel: { source: 'Test', action: 'Test' },
        storyAnalysis: {
          hero: 'Hero',
          parentPrompt: 'Prompt',
          coreLesson: 'Lesson',
          villain: 'Villain',
          characterArc: 'Arc',
          characterPersona: 'Persona'
        },
        episodeScript: {
          action: 'Test',
          scenes: [
            { scene: 1, title: 'Scene 1', dialog: 'Dialog 1' },
            { scene: 2, title: 'Scene 2', dialog: 'Dialog 2' }
          ]
        },
        staticKeyframes: { action: 'Test', keyframes: [] },
        videoGeneration: { action: 'Test', clips: [] },
        postProcessing: { action: 'Test' },
        language: 'English',
        drawingDescription: 'Test',
        parentPrompt: 'Test'
      });

      const savedPlan = await plan.save();
      expect(savedPlan.episodeScript.scenes).toHaveLength(2);
      expect(savedPlan.episodeScript.scenes[0].scene).toBe(1);
      expect(savedPlan.episodeScript.scenes[1].title).toBe('Scene 2');
    });
  });

  describe('Keyframes Validation', () => {
    it('should validate keyframe structure', async () => {
      const plan = new ProductionPlan({
        characterModel: { source: 'Test', action: 'Test' },
        storyAnalysis: {
          hero: 'Hero',
          parentPrompt: 'Prompt',
          coreLesson: 'Lesson',
          villain: 'Villain',
          characterArc: 'Arc',
          characterPersona: 'Persona'
        },
        episodeScript: { action: 'Test', scenes: [] },
        staticKeyframes: {
          action: 'Test',
          keyframes: [
            { keyframe: 1, scene: 1, prompt: 'Prompt 1' },
            { keyframe: 2, scene: 2, prompt: 'Prompt 2' }
          ]
        },
        videoGeneration: { action: 'Test', clips: [] },
        postProcessing: { action: 'Test' },
        language: 'English',
        drawingDescription: 'Test',
        parentPrompt: 'Test'
      });

      const savedPlan = await plan.save();
      expect(savedPlan.staticKeyframes.keyframes).toHaveLength(2);
      expect(savedPlan.staticKeyframes.keyframes[0].keyframe).toBe(1);
      expect(savedPlan.staticKeyframes.keyframes[1].prompt).toBe('Prompt 2');
    });
  });
});

