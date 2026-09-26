import { Router } from 'express';
import {
    generateCharacterModel,
    generateKeyframe,
    generateVideo,
    getAssetsByPlan,
    getAsset
} from '../controllers/assetController.js';

const router = Router();

// POST /api/assets/character-model - Generate character model
router.post('/character-model', generateCharacterModel);

// POST /api/assets/keyframe - Generate a keyframe
router.post('/keyframe', generateKeyframe);

// POST /api/assets/video - Generate a video
router.post('/video', generateVideo);

// GET /api/assets/plan/:productionPlanId - Get all assets for a plan
router.get('/plan/:productionPlanId', getAssetsByPlan);

// GET /api/assets/:id - Get a specific asset
router.get('/:id', getAsset);

export default router;

