import { jest } from '@jest/globals';
import { mockProductionPlan, mockGeneratedImage, mockVideoUrl } from '../utils/testHelpers.js';

export const mockGeminiService = {
  generateProductionPlan: jest.fn().mockResolvedValue(mockProductionPlan),
  generateImage: jest.fn().mockResolvedValue(mockGeneratedImage),
  generateVideo: jest.fn().mockResolvedValue(mockVideoUrl),
  createChatSession: jest.fn().mockReturnValue({
    sendMessage: jest.fn().mockResolvedValue({
      text: 'Hello! I am Sir Brave, ready for adventure!'
    })
  }),
  dataUriToParts: jest.fn().mockReturnValue({
    base64: 'mockBase64Data',
    mimeType: 'image/png'
  })
};

export const resetGeminiServiceMocks = () => {
  mockGeminiService.generateProductionPlan.mockClear();
  mockGeminiService.generateImage.mockClear();
  mockGeminiService.generateVideo.mockClear();
  mockGeminiService.createChatSession.mockClear();
};

