import { Request, Response } from 'express';
import geminiService from '../services/geminiService.js';

export const generateImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt, image } = req.body;

    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    const imageData = image ? { data: image.data, mimeType: image.mimeType } : undefined;
    const generatedImage = await geminiService.generateImage(prompt, imageData);

    res.json({
      success: true,
      data: {
        image: generatedImage
      }
    });
  } catch (error: any) {
    console.error('Error generating image:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to generate image' 
    });
  }
};

export const generateVideo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt, keyframeImage } = req.body;

    if (!prompt || !keyframeImage) {
      res.status(400).json({ error: 'Prompt and keyframe image are required' });
      return;
    }

    const videoUrl = await geminiService.generateVideo(prompt, keyframeImage);

    res.json({
      success: true,
      data: {
        videoUrl
      }
    });
  } catch (error: any) {
    console.error('Error generating video:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to generate video' 
    });
  }
};

