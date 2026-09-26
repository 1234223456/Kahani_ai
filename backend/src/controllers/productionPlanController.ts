import { Request, Response } from 'express';
import ProductionPlan from '../models/ProductionPlan.js';
import geminiService from '../services/geminiService.js';

export const generateProductionPlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { drawingDesc, parentPrompt, language, imageBase64, imageMimeType, userId } = req.body;

    if (!drawingDesc && !imageBase64) {
      res.status(400).json({ error: 'Please provide either a drawing description or an image.' });
      return;
    }

    if (!parentPrompt) {
      res.status(400).json({ error: 'Please provide a parent prompt.' });
      return;
    }

    // Generate production plan using Gemini
    const plan = await geminiService.generateProductionPlan({
      drawing: drawingDesc || '',
      parentPrompt,
      language: language || 'English',
      imageBase64,
      imageMimeType
    });

    // Save to database
    const productionPlan = new ProductionPlan({
      userId,
      ...plan,
      language: language || 'English',
      drawingDescription: drawingDesc || '',
      parentPrompt,
      characterImage: imageBase64 ? `data:${imageMimeType};base64,${imageBase64}` : undefined
    });

    await productionPlan.save();

    res.status(201).json({
      success: true,
      data: {
        id: productionPlan._id,
        ...plan
      }
    });
  } catch (error: any) {
    console.error('Error generating production plan:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to generate production plan' 
    });
  }
};

export const getProductionPlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const plan = await ProductionPlan.findById(id);

    if (!plan) {
      res.status(404).json({ error: 'Production plan not found' });
      return;
    }

    res.json({
      success: true,
      data: plan
    });
  } catch (error: any) {
    console.error('Error fetching production plan:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch production plan' 
    });
  }
};

export const getUserProductionPlans = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { limit = 10, page = 1 } = req.query;

    const plans = await ProductionPlan.find({ userId })
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await ProductionPlan.countDocuments({ userId });

    res.json({
      success: true,
      data: plans,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    console.error('Error fetching user production plans:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch production plans' 
    });
  }
};

export const updateProductionPlanAssets = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { characterModelImage, keyframeImages, videoUrls } = req.body;

    const plan = await ProductionPlan.findById(id);

    if (!plan) {
      res.status(404).json({ error: 'Production plan not found' });
      return;
    }

    if (characterModelImage) {
      plan.generatedAssets = plan.generatedAssets || {};
      plan.generatedAssets.characterModelImage = characterModelImage;
    }

    if (keyframeImages) {
      plan.generatedAssets = plan.generatedAssets || {};
      plan.generatedAssets.keyframeImages = keyframeImages;
    }

    if (videoUrls) {
      plan.generatedAssets = plan.generatedAssets || {};
      plan.generatedAssets.videoUrls = videoUrls;
    }

    await plan.save();

    res.json({
      success: true,
      data: plan
    });
  } catch (error: any) {
    console.error('Error updating production plan assets:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to update production plan assets' 
    });
  }
};

export const deleteProductionPlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const plan = await ProductionPlan.findByIdAndDelete(id);

    if (!plan) {
      res.status(404).json({ error: 'Production plan not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Production plan deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting production plan:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to delete production plan' 
    });
  }
};
