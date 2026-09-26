import mongoose from 'mongoose';
import ChatSession from '../../../src/models/ChatSession.js';
import ProductionPlan from '../../../src/models/ProductionPlan.js';

describe('ChatSession Model Unit Tests', () => {
  let productionPlanId: mongoose.Types.ObjectId;

  beforeEach(async () => {
    // Create a production plan for testing
    const plan = new ProductionPlan({
      characterModel: { source: 'Test', action: 'Test' },
      storyAnalysis: {
        hero: 'Hero',
        parentPrompt: 'Prompt',
        coreLesson: 'Lesson',
        villain: 'Villain',
        characterArc: 'Arc',
        characterPersona: 'A friendly character'
      },
      episodeScript: { action: 'Test', scenes: [] },
      staticKeyframes: { action: 'Test', keyframes: [] },
      videoGeneration: { action: 'Test', clips: [] },
      postProcessing: { action: 'Test' },
      language: 'English',
      drawingDescription: 'Test',
      parentPrompt: 'Test'
    });
    const savedPlan = await plan.save();
    productionPlanId = savedPlan._id as mongoose.Types.ObjectId;
  });

  describe('Model Validation', () => {
    it('should create a valid chat session', async () => {
      const validSession = new ChatSession({
        sessionId: 'test-session-123',
        userId: 'user-123',
        productionPlanId,
        persona: 'A friendly character who loves to help',
        messages: []
      });

      const savedSession = await validSession.save();
      expect(savedSession._id).toBeDefined();
      expect(savedSession.sessionId).toBe('test-session-123');
      expect(savedSession.createdAt).toBeDefined();
      expect(savedSession.updatedAt).toBeDefined();
    });

    it('should fail without required fields', async () => {
      const invalidSession = new ChatSession({
        sessionId: 'test-session'
        // Missing required fields
      });

      await expect(invalidSession.save()).rejects.toThrow();
    });

    it('should enforce unique sessionId', async () => {
      const session1 = new ChatSession({
        sessionId: 'unique-session-id',
        productionPlanId,
        persona: 'Test persona',
        messages: []
      });
      await session1.save();

      const session2 = new ChatSession({
        sessionId: 'unique-session-id', // Same ID
        productionPlanId,
        persona: 'Test persona',
        messages: []
      });

      await expect(session2.save()).rejects.toThrow();
    });
  });

  describe('Messages Array', () => {
    it('should store messages correctly', async () => {
      const session = new ChatSession({
        sessionId: 'test-session-456',
        productionPlanId,
        persona: 'Test persona',
        messages: [
          { role: 'user', text: 'Hello!', timestamp: new Date() },
          { role: 'model', text: 'Hi there!', timestamp: new Date() }
        ]
      });

      const savedSession = await session.save();
      expect(savedSession.messages).toHaveLength(2);
      expect(savedSession.messages[0].role).toBe('user');
      expect(savedSession.messages[1].role).toBe('model');
    });

    it('should validate message role', async () => {
      const session = new ChatSession({
        sessionId: 'test-session-789',
        productionPlanId,
        persona: 'Test persona',
        messages: [
          { role: 'invalid' as any, text: 'Test', timestamp: new Date() }
        ]
      });

      await expect(session.save()).rejects.toThrow();
    });

    it('should add messages dynamically', async () => {
      const session = new ChatSession({
        sessionId: 'test-session-dynamic',
        productionPlanId,
        persona: 'Test persona',
        messages: []
      });

      const savedSession = await session.save();

      // Add messages
      savedSession.messages.push(
        { role: 'user', text: 'Message 1', timestamp: new Date() }
      );
      savedSession.messages.push(
        { role: 'model', text: 'Response 1', timestamp: new Date() }
      );

      const updatedSession = await savedSession.save();
      expect(updatedSession.messages).toHaveLength(2);
    });

    it('should set default timestamp', async () => {
      const session = new ChatSession({
        sessionId: 'test-session-timestamp',
        productionPlanId,
        persona: 'Test persona',
        messages: [
          { role: 'user', text: 'Hello!' } as any
        ]
      });

      const savedSession = await session.save();
      expect(savedSession.messages[0].timestamp).toBeDefined();
      expect(savedSession.messages[0].timestamp).toBeInstanceOf(Date);
    });
  });

  describe('Indexes', () => {
    it('should index sessionId for fast queries', async () => {
      const indexes = ChatSession.schema.indexes();
      const sessionIdIndex = indexes.find((idx: any) => idx[0].sessionId === 1);
      expect(sessionIdIndex).toBeDefined();
    });

    it('should index userId for fast queries', async () => {
      const indexes = ChatSession.schema.indexes();
      const userIdIndex = indexes.find((idx: any) => idx[0].userId === 1);
      expect(userIdIndex).toBeDefined();
    });
  });

  describe('Production Plan Reference', () => {
    it('should populate production plan reference', async () => {
      const session = new ChatSession({
        sessionId: 'test-session-ref',
        productionPlanId,
        persona: 'Test persona',
        messages: []
      });

      await session.save();

      const populatedSession = await ChatSession.findOne({ 
        sessionId: 'test-session-ref' 
      }).populate('productionPlanId');

      expect(populatedSession).toBeDefined();
      expect(populatedSession?.productionPlanId).toBeDefined();
    });
  });
});

