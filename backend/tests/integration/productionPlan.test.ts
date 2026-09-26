import request from 'supertest';
import express, { Application } from 'express';
import cors from 'cors';
import productionPlanRoutes from '../../src/routes/productionPlanRoutes.js';
import ProductionPlan from '../../src/models/ProductionPlan.js';
import { createMockProductionPlanData } from '../utils/testHelpers.js';
import geminiService from '../../src/services/geminiService.js';

// Mock the gemini service
jest.mock('../../src/services/geminiService.js');

describe('Production Plan API Integration Tests', () => {
  let app: Application;

  beforeAll(() => {
    app = express();
    app.use(cors());
    app.use(express.json({ limit: '50mb' }));
    app.use('/api/production-plans', productionPlanRoutes);
  });

  beforeEach(() => {
    // Set up the mock return value before each test
    (geminiService.generateProductionPlan as jest.Mock).mockResolvedValue({
      characterModel: {
        source: 'Test character',
        action: 'Test action'
      },
      storyAnalysis: {
        hero: 'Test Hero',
        parentPrompt: 'Test lesson',
        coreLesson: 'Test core lesson',
        villain: 'Test Villain',
        characterArc: 'Test arc',
        characterPersona: 'Test persona'
      },
      episodeScript: {
        action: 'Test script action',
        scenes: [{ scene: 1, title: 'Scene 1', dialog: 'Test dialog' }]
      },
      staticKeyframes: {
        action: 'Test keyframe action',
        keyframes: [{ keyframe: 1, scene: 1, prompt: 'Test prompt' }]
      },
      videoGeneration: {
        action: 'Test video action',
        clips: [{ clip: 1, input: 'Test input', prompt: 'Test prompt' }]
      },
      postProcessing: {
        action: 'Test post processing'
      }
    });
  });

  describe('POST /api/production-plans', () => {
    it('should create a new production plan with valid data', async () => {
      const mockData = createMockProductionPlanData();

      const response = await request(app)
        .post('/api/production-plans')
        .send(mockData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.characterModel).toBeDefined();
      expect(response.body.data.storyAnalysis).toBeDefined();
    });

    it('should return 400 if drawingDesc and imageBase64 are both missing', async () => {
      const response = await request(app)
        .post('/api/production-plans')
        .send({
          parentPrompt: 'Test lesson',
          language: 'English'
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should return 400 if parentPrompt is missing', async () => {
      const response = await request(app)
        .post('/api/production-plans')
        .send({
          drawingDesc: 'A brave knight',
          language: 'English'
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should save production plan to database', async () => {
      const mockData = createMockProductionPlanData();

      const response = await request(app)
        .post('/api/production-plans')
        .send(mockData)
        .expect(201);

      const savedPlan = await ProductionPlan.findById(response.body.data.id);
      expect(savedPlan).toBeDefined();
      expect(savedPlan?.drawingDescription).toBe(mockData.drawingDesc);
    });
  });

  describe('GET /api/production-plans/:id', () => {
    it('should get a production plan by ID', async () => {
      // First create a plan
      const mockData = createMockProductionPlanData();
      const createResponse = await request(app)
        .post('/api/production-plans')
        .send(mockData);

      const planId = createResponse.body.data.id;

      // Then retrieve it
      const response = await request(app)
        .get(`/api/production-plans/${planId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(planId);
    });

    it('should return 404 for non-existent ID', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .get(`/api/production-plans/${fakeId}`)
        .expect(404);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/production-plans/user/:userId', () => {
    it('should get all production plans for a user', async () => {
      const userId = 'test-user-123';

      // Create multiple plans for the user
      await request(app)
        .post('/api/production-plans')
        .send(createMockProductionPlanData({ userId }));

      await request(app)
        .post('/api/production-plans')
        .send(createMockProductionPlanData({ userId }));

      // Get user's plans
      const response = await request(app)
        .get(`/api/production-plans/user/${userId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.total).toBe(2);
    });

    it('should support pagination', async () => {
      const userId = 'test-user-456';

      // Create 3 plans
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/production-plans')
          .send(createMockProductionPlanData({ userId }));
      }

      const response = await request(app)
        .get(`/api/production-plans/user/${userId}?limit=2&page=1`)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
      expect(response.body.pagination.total).toBe(3);
    });
  });

  describe('PATCH /api/production-plans/:id/assets', () => {
    it('should update production plan assets', async () => {
      // Create a plan
      const mockData = createMockProductionPlanData();
      const createResponse = await request(app)
        .post('/api/production-plans')
        .send(mockData);

      const planId = createResponse.body.data.id;

      // Update assets
      const assets = {
        characterModelImage: 'data:image/png;base64,test',
        keyframeImages: ['data:image/png;base64,kf1', 'data:image/png;base64,kf2'],
        videoUrls: ['https://example.com/video1.mp4']
      };

      const response = await request(app)
        .patch(`/api/production-plans/${planId}/assets`)
        .send(assets)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.generatedAssets).toBeDefined();
      expect(response.body.data.generatedAssets.characterModelImage).toBe(assets.characterModelImage);
    });

    it('should return 404 for non-existent plan', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .patch(`/api/production-plans/${fakeId}/assets`)
        .send({ characterModelImage: 'test' })
        .expect(404);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('DELETE /api/production-plans/:id', () => {
    it('should delete a production plan', async () => {
      // Create a plan
      const mockData = createMockProductionPlanData();
      const createResponse = await request(app)
        .post('/api/production-plans')
        .send(mockData);

      const planId = createResponse.body.data.id;

      // Delete it
      const response = await request(app)
        .delete(`/api/production-plans/${planId}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify it's deleted
      const deletedPlan = await ProductionPlan.findById(planId);
      expect(deletedPlan).toBeNull();
    });

    it('should return 404 for non-existent plan', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      
      const response = await request(app)
        .delete(`/api/production-plans/${fakeId}`)
        .expect(404);

      expect(response.body.error).toBeDefined();
    });
  });
});

