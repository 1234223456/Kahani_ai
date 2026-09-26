import { Request, Response } from 'express';
import ChatSession from '../models/ChatSession.js';
import ProductionPlan from '../models/ProductionPlan.js';
import geminiService from '../services/geminiService.js';
import { v4 as uuidv4 } from 'uuid';

// In-memory storage for active chat sessions (consider using Redis for production)
const activeChatSessions = new Map<string, any>();

export const createChatSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productionPlanId, userId } = req.body;

    if (!productionPlanId) {
      res.status(400).json({ error: 'Production plan ID is required' });
      return;
    }

    // Get production plan to extract persona
    const plan = await ProductionPlan.findById(productionPlanId);
    if (!plan) {
      res.status(404).json({ error: 'Production plan not found' });
      return;
    }

    const sessionId = uuidv4();
    const persona = plan.storyAnalysis.characterPersona;

    // Create chat session in database
    const chatSession = new ChatSession({
      sessionId,
      userId,
      productionPlanId,
      persona,
      messages: []
    });

    await chatSession.save();

    // Create Gemini chat session
    const geminiChat = geminiService.createChatSession(persona);
    activeChatSessions.set(sessionId, geminiChat);

    res.status(201).json({
      success: true,
      data: {
        sessionId,
        persona
      }
    });
  } catch (error: any) {
    console.error('Error creating chat session:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to create chat session' 
    });
  }
};

export const sendMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const { message } = req.body;

    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    // Get chat session from database
    const chatSession = await ChatSession.findOne({ sessionId });
    if (!chatSession) {
      res.status(404).json({ error: 'Chat session not found' });
      return;
    }

    // Get or recreate Gemini chat session
    let geminiChat = activeChatSessions.get(sessionId);
    if (!geminiChat) {
      // Recreate chat session if not in memory
      geminiChat = geminiService.createChatSession(chatSession.persona);
      activeChatSessions.set(sessionId, geminiChat);
    }

    // Send message to Gemini
    const response = await geminiChat.sendMessage({ message });
    const modelResponse = response.text;

    // Save messages to database
    chatSession.messages.push(
      { role: 'user', text: message, timestamp: new Date() },
      { role: 'model', text: modelResponse, timestamp: new Date() }
    );
    await chatSession.save();

    res.json({
      success: true,
      data: {
        userMessage: message,
        modelResponse
      }
    });
  } catch (error: any) {
    console.error('Error sending message:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to send message' 
    });
  }
};

export const getChatHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;

    const chatSession = await ChatSession.findOne({ sessionId });
    if (!chatSession) {
      res.status(404).json({ error: 'Chat session not found' });
      return;
    }

    res.json({
      success: true,
      data: {
        sessionId: chatSession.sessionId,
        messages: chatSession.messages,
        persona: chatSession.persona
      }
    });
  } catch (error: any) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch chat history' 
    });
  }
};

export const deleteChatSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;

    const chatSession = await ChatSession.findOneAndDelete({ sessionId });
    if (!chatSession) {
      res.status(404).json({ error: 'Chat session not found' });
      return;
    }

    // Remove from active sessions
    activeChatSessions.delete(sessionId);

    res.json({
      success: true,
      message: 'Chat session deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting chat session:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to delete chat session' 
    });
  }
};
