import express from 'express';
import {
  createChatSession,
  sendMessage,
  getChatHistory,
  deleteChatSession
} from '../controllers/chatController.js';

const router = express.Router();

/**
 * @route   POST /api/chat/sessions
 * @desc    Create a new chat session
 * @access  Public
 */
router.post('/sessions', createChatSession);

/**
 * @route   POST /api/chat/sessions/:sessionId/messages
 * @desc    Send a message in a chat session
 * @access  Public
 */
router.post('/sessions/:sessionId/messages', sendMessage);

/**
 * @route   GET /api/chat/sessions/:sessionId
 * @desc    Get chat history for a session
 * @access  Public
 */
router.get('/sessions/:sessionId', getChatHistory);

/**
 * @route   DELETE /api/chat/sessions/:sessionId
 * @desc    Delete a chat session
 * @access  Public
 */
router.delete('/sessions/:sessionId', deleteChatSession);

export default router;
