import request from 'supertest';
import express, { Application } from 'express';
import cors from 'cors';
import geminiRoutes from '../../src/routes/geminiRoutes.js';
import geminiService from '../../src/services/geminiService.js';

// Mock the gemini service
jest.mock('../../src/services/geminiService.js');

describe('Gemini API Integration Tests', () => {
  let app: Application;

  beforeAll(() => {
    app = express();
    app.use(cors());
    app.use(express.json({ limit: '50mb' }));
    app.use('/api/gemini', geminiRoutes);
  });

  beforeEach(() => {
    // Set up the mocks
    (geminiService.generateImage as jest.Mock).mockResolvedValue('data:image/png;base64,mockImage');
    (geminiService.generateVideo as jest.Mock).mockResolvedValue('https://example.com/video/test.mp4?key=test');
  });

  describe('POST /api/gemini/generate-image', () => {
    it('should generate an image with valid prompt', async () => {
      const response = await request(app)
        .post('/api/gemini/generate-image')
        .send({
          prompt: 'A brave knight in shining armor'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.image).toBeDefined();
      expect(response.body.data.image).toContain('data:image');
    });

    it('should generate image with input image reference', async () => {
      const response = await request(app)
        .post('/api/gemini/generate-image')
        .send({
          prompt: 'A brave knight in shining armor',
          image: {
            data: 'base64_encoded_data',
            mimeType: 'image/png'
          }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.image).toBeDefined();
    });

    it('should return 400 if prompt is missing', async () => {
      const response = await request(app)
        .post('/api/gemini/generate-image')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Prompt is required');
    });

    it('should handle errors gracefully', async () => {
      // Mock a failure
      (geminiService.generateImage as jest.Mock).mockRejectedValueOnce(
        new Error('API error')
      );

      const response = await request(app)
        .post('/api/gemini/generate-image')
        .send({
          prompt: 'Test prompt'
        })
        .expect(500);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /api/gemini/generate-video', () => {
    it('should generate a video with valid data', async () => {
      const response = await request(app)
        .post('/api/gemini/generate-video')
        .send({
          prompt: 'Knight walking through forest',
          keyframeImage: 'data:image/png;base64,test'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.videoUrl).toBeDefined();
      expect(response.body.data.videoUrl).toContain('video');
    });

    it('should return 400 if prompt is missing', async () => {
      const response = await request(app)
        .post('/api/gemini/generate-video')
        .send({
          keyframeImage: 'data:image/png;base64,test'
        })
        .expect(400);

      expect(response.body.error).toBe('Prompt and keyframe image are required');
    });

    it('should return 400 if keyframeImage is missing', async () => {
      const response = await request(app)
        .post('/api/gemini/generate-video')
        .send({
          prompt: 'Knight walking'
        })
        .expect(400);

      expect(response.body.error).toBe('Prompt and keyframe image are required');
    });

    it('should handle video generation errors', async () => {
      (geminiService.generateVideo as jest.Mock).mockRejectedValueOnce(
        new Error('Video generation failed')
      );

      const response = await request(app)
        .post('/api/gemini/generate-video')
        .send({
          prompt: 'Test prompt',
          keyframeImage: 'data:image/png;base64,test'
        })
        .expect(500);

      expect(response.body.error).toBeDefined();
    });
  });
});

