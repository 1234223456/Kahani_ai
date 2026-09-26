import express from 'express';
import {
  generateProductionPlan,
  getProductionPlan,
  getUserProductionPlans,
  updateProductionPlanAssets,
  deleteProductionPlan
} from '../controllers/productionPlanController.js';

const router = express.Router();

/**
 * @route   POST /api/production-plans
 * @desc    Generate a new production plan
 * @access  Public
 */
router.post('/', generateProductionPlan);

/**
 * @route   GET /api/production-plans/:id
 * @desc    Get a production plan by ID
 * @access  Public
 */
router.get('/:id', getProductionPlan);

/**
 * @route   GET /api/production-plans/user/:userId
 * @desc    Get all production plans for a user
 * @access  Public
 */
router.get('/user/:userId', getUserProductionPlans);

/**
 * @route   PATCH /api/production-plans/:id/assets
 * @desc    Update production plan assets (images, videos)
 * @access  Public
 */
router.patch('/:id/assets', updateProductionPlanAssets);

/**
 * @route   DELETE /api/production-plans/:id
 * @desc    Delete a production plan
 * @access  Public
 */
router.delete('/:id', deleteProductionPlan);

export default router;
