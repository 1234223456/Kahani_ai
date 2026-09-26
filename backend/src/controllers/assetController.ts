import { Request, Response } from 'express';
import GeneratedAsset from '../models/GeneratedAsset.js';
import ProductionPlan from '../models/ProductionPlan.js';
import geminiService from '../services/geminiService.js';

/**
 * Generate character model image
 */
export const generateCharacterModel = async (req: Request, res: Response) => {
    try {
        const { productionPlanId, imageBase64, imageMimeType } = req.body;

        // Validate production plan exists
        const plan = await ProductionPlan.findById(productionPlanId);
        if (!plan) {
            return res.status(404).json({ error: 'Production plan not found' });
        }

        // Create prompt for character model
        const characterPrompt = `${plan.characterModel.action}. The character should be based on this description: "${plan.characterModel.source}". Style: 3D Disney Pixar animation style, high quality, vibrant colors, smooth textures, expressive features, professional animation quality.`;

        // Generate image
        const inputImage = imageBase64 && imageMimeType 
            ? { data: imageBase64, mimeType: imageMimeType }
            : undefined;

        const generatedImage = await geminiService.generateImage(characterPrompt, inputImage);

        // Save to database (generatedImage is a data URI string)
        const asset = new GeneratedAsset({
            productionPlanId,
            assetType: 'character_model',
            dataUri: generatedImage,
            prompt: characterPrompt,
            status: 'completed'
        });

        await asset.save();

        res.status(201).json({
            success: true,
            data: asset
        });

    } catch (error: any) {
        console.error('Error generating character model:', error);
        res.status(500).json({ 
            error: error.message || 'Failed to generate character model' 
        });
    }
};

/**
 * Generate a keyframe image
 */
export const generateKeyframe = async (req: Request, res: Response) => {
    try {
        const { productionPlanId, keyframeIndex, characterModelData, characterModelMimeType } = req.body;

        // Validate production plan exists
        const plan = await ProductionPlan.findById(productionPlanId);
        if (!plan) {
            return res.status(404).json({ error: 'Production plan not found' });
        }

        // Validate keyframe index
        if (keyframeIndex < 0 || keyframeIndex >= plan.staticKeyframes.keyframes.length) {
            return res.status(400).json({ error: 'Invalid keyframe index' });
        }

        const keyframeData = plan.staticKeyframes.keyframes[keyframeIndex];

        // Generate keyframe image
        const characterImage = characterModelData && characterModelMimeType
            ? { data: characterModelData, mimeType: characterModelMimeType }
            : undefined;

        const generatedImage = await geminiService.generateImage(
            keyframeData.prompt,
            characterImage
        );

        // Save to database (generatedImage is a data URI string)
        const asset = new GeneratedAsset({
            productionPlanId,
            assetType: 'keyframe',
            assetIndex: keyframeIndex,
            dataUri: generatedImage,
            prompt: keyframeData.prompt,
            status: 'completed'
        });

        await asset.save();

        res.status(201).json({
            success: true,
            data: asset
        });

    } catch (error: any) {
        console.error('Error generating keyframe:', error);
        res.status(500).json({ 
            error: error.message || 'Failed to generate keyframe' 
        });
    }
};

/**
 * Generate a video clip
 */
export const generateVideo = async (req: Request, res: Response) => {
    try {
        const { productionPlanId, clipIndex, keyframeData, keyframeMimeType } = req.body;

        // Validate production plan exists
        const plan = await ProductionPlan.findById(productionPlanId);
        if (!plan) {
            return res.status(404).json({ error: 'Production plan not found' });
        }

        // Validate clip index
        if (clipIndex < 0 || clipIndex >= plan.videoGeneration.clips.length) {
            return res.status(400).json({ error: 'Invalid clip index' });
        }

        if (!keyframeData || !keyframeMimeType) {
            return res.status(400).json({ error: 'Keyframe data is required for video generation' });
        }

        const clipData = plan.videoGeneration.clips[clipIndex];

        // Mark as generating
        const asset = new GeneratedAsset({
            productionPlanId,
            assetType: 'video',
            assetIndex: clipIndex,
            prompt: clipData.prompt,
            status: 'generating'
        });
        await asset.save();

        // Generate video (this is a long-running operation)
        // keyframeData should be a data URI string
        const keyframeDataUri = `data:${keyframeMimeType};base64,${keyframeData}`;
        
        try {
            const videoUrl = await geminiService.generateVideo(
                clipData.prompt,
                keyframeDataUri
            );

            // Update asset with video URL
            asset.url = videoUrl;
            asset.status = 'completed';
            await asset.save();

            res.status(201).json({
                success: true,
                data: asset
            });

        } catch (videoError: any) {
            asset.status = 'failed';
            asset.errorMessage = videoError.message;
            await asset.save();
            throw videoError;
        }

    } catch (error: any) {
        console.error('Error generating video:', error);
        res.status(500).json({ 
            error: error.message || 'Failed to generate video' 
        });
    }
};

/**
 * Get all assets for a production plan
 */
export const getAssetsByPlan = async (req: Request, res: Response) => {
    try {
        const { productionPlanId } = req.params;

        const assets = await GeneratedAsset.find({ productionPlanId })
            .sort({ assetType: 1, assetIndex: 1 });

        res.json({
            success: true,
            data: assets
        });

    } catch (error: any) {
        console.error('Error fetching assets:', error);
        res.status(500).json({ 
            error: error.message || 'Failed to fetch assets' 
        });
    }
};

/**
 * Get a specific asset
 */
export const getAsset = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const asset = await GeneratedAsset.findById(id);

        if (!asset) {
            return res.status(404).json({ error: 'Asset not found' });
        }

        res.json({
            success: true,
            data: asset
        });

    } catch (error: any) {
        console.error('Error fetching asset:', error);
        res.status(500).json({ 
            error: error.message || 'Failed to fetch asset' 
        });
    }
};

