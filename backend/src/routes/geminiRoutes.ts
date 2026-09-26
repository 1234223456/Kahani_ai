import express from 'express';
import { generateImage, generateVideo } from '../controllers/geminiController.js';

const router = express.Router();

/**
 * @route   POST /api/gemini/generate-image
 * @desc    Generate an image using Gemini
 * @access  Public
 */
router.post('/generate-image', generateImage);

/**
 * @route   POST /api/gemini/generate-video
 * @desc    Generate a video using Gemini
 * @access  Public
 */
router.post('/generate-video', generateVideo);

export default router;

