import request from 'supertest';
import express, { Application } from 'express';
import cors from 'cors';
import chatRoutes from '../../src/routes/chatRoutes.js';
import productionPlanRoutes from '../../src/routes/productionPlanRoutes.js';
import ChatSession from '../../src/models/ChatSession.js';
import { createMockProductionPlanData } from '../utils/testHelpers.js';
import geminiService from '../../src/services/geminiService.js';

// Mock the gemini service
jest.mock('../../src/services/geminiService.js');

describe('Chat API Integration Tests', () => {
  let app: Application;
  let productionPlanId: string;

  beforeAll(() => {
    app = express();
    app.use(cors());
    app.use(express.json({ limit: '50mb' }));
    app.use('/api/production-plans', productionPlanRoutes);
    app.use('/api/chat', chatRoutes);
  });

  beforeEach(async () => {
    // Set up the mock return values
    const mockSendMessage = jest.fn().mockResolvedValue({
      text: 'Hello! How can I help you today?'
    });

    (geminiService.generateProductionPlan as jest.Mock).mockResolvedValue({
      characterModel: { source: 'Test', action: 'Test' },
      storyAnalysis: {
        hero: 'Hero',
        parentPrompt: 'Test',
        coreLesson: 'Test',
        villain: 'Villain',
        characterArc: 'Arc',
        characterPersona: 'A friendly character who loves to help.'
      },
      episodeScript: { action: 'Test', scenes: [] },
      staticKeyframes: { action: 'Test', keyframes: [] },
      videoGeneration: { action: 'Test', clips: [] },
      postProcessing: { action: 'Test' }
    });

    (geminiService.createChatSession as jest.Mock).mockReturnValue({
      sendMessage: mockSendMessage
    });

    // Create a production plan for testing
    const mockData = createMockProductionPlanData();
    const response = await request(app)
      .post('/api/production-plans')
      .send(mockData);
    
    productionPlanId = response.body.data.id;
  });

  describe('POST /api/chat/sessions', () => {
    it('should create a new chat session', async () => {
      const response = await request(app)
        .post('/api/chat/sessions')
        .send({
          productionPlanId,
          userId: 'test-user-123'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sessionId).toBeDefined();
      expect(response.body.data.persona).toBeDefined();
    });

    it('should return 400 if productionPlanId is missing', async () => {
      const response = await request(app)
        .post('/api/chat/sessions')
        .send({
          userId: 'test-user-123'
        })
        .expect(400);

      expect(response.body.error).toBe('Production plan ID is required');
    });

    it('should return 404 if production plan does not exist', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .post('/api/chat/sessions')
        .send({
          productionPlanId: fakeId,
          userId: 'test-user-123'
        })
        .expect(404);

      expect(response.body.error).toBe('Production plan not found');
    });

    it('should save chat session to database', async () => {
      const response = await request(app)
        .post('/api/chat/sessions')
        .send({
          productionPlanId,
          userId: 'test-user-123'
        });

      const session = await ChatSession.findOne({ 
        sessionId: response.body.data.sessionId 
      });

      expect(session).toBeDefined();
      expect(session?.productionPlanId.toString()).toBe(productionPlanId);
    });
  });

  describe('POST /api/chat/sessions/:sessionId/messages', () => {
    let sessionId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/chat/sessions')
        .send({ productionPlanId, userId: 'test-user-123' });
      
      sessionId = response.body.data.sessionId;
    });

    it('should send a message and get a response', async () => {
      const response = await request(app)
        .post(`/api/chat/sessions/${sessionId}/messages`)
        .send({
          message: 'Hello, how are you?'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.userMessage).toBe('Hello, how are you?');
      expect(response.body.data.modelResponse).toBeDefined();
    });

    it('should return 400 if message is missing', async () => {
      const response = await request(app)
        .post(`/api/chat/sessions/${sessionId}/messages`)
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Message is required');
    });

    it('should return 404 if session does not exist', async () => {
      const fakeSessionId = 'fake-session-id';

      const response = await request(app)
        .post(`/api/chat/sessions/${fakeSessionId}/messages`)
        .send({
          message: 'Hello'
        })
        .expect(404);

      expect(response.body.error).toBe('Chat session not found');
    });

    it('should save messages to database', async () => {
      await request(app)
        .post(`/api/chat/sessions/${sessionId}/messages`)
        .send({
          message: 'Test message'
        });

      const session = await ChatSession.findOne({ sessionId });
      expect(session?.messages).toHaveLength(2); // user + model
      expect(session?.messages[0].role).toBe('user');
      expect(session?.messages[0].text).toBe('Test message');
      expect(session?.messages[1].role).toBe('model');
    });
  });

  describe('GET /api/chat/sessions/:sessionId', () => {
    let sessionId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/chat/sessions')
        .send({ productionPlanId, userId: 'test-user-123' });
      
      sessionId = response.body.data.sessionId;

      // Send a few messages
      await request(app)
        .post(`/api/chat/sessions/${sessionId}/messages`)
        .send({ message: 'Message 1' });
      
      await request(app)
        .post(`/api/chat/sessions/${sessionId}/messages`)
        .send({ message: 'Message 2' });
    });

    it('should get chat history', async () => {
      const response = await request(app)
        .get(`/api/chat/sessions/${sessionId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sessionId).toBe(sessionId);
      expect(response.body.data.messages).toHaveLength(4); // 2 user + 2 model
      expect(response.body.data.persona).toBeDefined();
    });

    it('should return 404 if session does not exist', async () => {
      const fakeSessionId = 'fake-session-id';

      const response = await request(app)
        .get(`/api/chat/sessions/${fakeSessionId}`)
        .expect(404);

      expect(response.body.error).toBe('Chat session not found');
    });
  });

  describe('DELETE /api/chat/sessions/:sessionId', () => {
    let sessionId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/chat/sessions')
        .send({ productionPlanId, userId: 'test-user-123' });
      
      sessionId = response.body.data.sessionId;
    });

    it('should delete a chat session', async () => {
      const response = await request(app)
        .delete(`/api/chat/sessions/${sessionId}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify deletion
      const session = await ChatSession.findOne({ sessionId });
      expect(session).toBeNull();
    });

    it('should return 404 if session does not exist', async () => {
      const fakeSessionId = 'fake-session-id';

      const response = await request(app)
        .delete(`/api/chat/sessions/${fakeSessionId}`)
        .expect(404);

      expect(response.body.error).toBe('Chat session not found');
    });
  });
});

