import type { ProductionPlan } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002/api';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  // Helper method for API calls
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(errorData.error || `HTTP Error: ${response.status}`);
    }

    const result: ApiResponse<T> = await response.json();
    return result.data;
  }

  // Production Plan APIs
  async generateProductionPlan(
    drawingDesc: string,
    parentPrompt: string,
    language: string,
    imageBase64: string | null,
    imageMimeType: string | null,
    userId?: string
  ): Promise<ProductionPlan & { id: string }> {
    return this.request<ProductionPlan & { id: string }>('/production-plans', {
      method: 'POST',
      body: JSON.stringify({
        drawingDesc,
        parentPrompt,
        language,
        imageBase64,
        imageMimeType,
        userId,
      }),
    });
  }

  async getProductionPlan(id: string): Promise<ProductionPlan> {
    return this.request<ProductionPlan>(`/production-plans/${id}`, {
      method: 'GET',
    });
  }

  async getUserProductionPlans(userId: string, page = 1, limit = 10) {
    return this.request<{ data: ProductionPlan[]; pagination: any }>(
      `/production-plans/user/${userId}?page=${page}&limit=${limit}`,
      { method: 'GET' }
    );
  }

  async updateProductionPlanAssets(
    id: string,
    assets: {
      characterModelImage?: string;
      keyframeImages?: string[];
      videoUrls?: string[];
    }
  ): Promise<ProductionPlan> {
    return this.request<ProductionPlan>(`/production-plans/${id}/assets`, {
      method: 'PATCH',
      body: JSON.stringify(assets),
    });
  }

  async deleteProductionPlan(id: string): Promise<void> {
    await this.request<void>(`/production-plans/${id}`, {
      method: 'DELETE',
    });
  }

  // Gemini APIs
  async generateImage(
    prompt: string,
    image?: { data: string; mimeType: string }
  ): Promise<{ image: string }> {
    return this.request<{ image: string }>('/gemini/generate-image', {
      method: 'POST',
      body: JSON.stringify({ prompt, image }),
    });
  }

  async generateVideo(
    prompt: string,
    keyframeImage: string
  ): Promise<{ videoUrl: string }> {
    return this.request<{ videoUrl: string }>('/gemini/generate-video', {
      method: 'POST',
      body: JSON.stringify({ prompt, keyframeImage }),
    });
  }

  // Chat APIs
  async createChatSession(
    productionPlanId: string,
    userId?: string
  ): Promise<{ sessionId: string; persona: string }> {
    return this.request<{ sessionId: string; persona: string }>('/chat/sessions', {
      method: 'POST',
      body: JSON.stringify({ productionPlanId, userId }),
    });
  }

  async sendMessage(
    sessionId: string,
    message: string
  ): Promise<{ userMessage: string; modelResponse: string }> {
    return this.request<{ userMessage: string; modelResponse: string }>(
      `/chat/sessions/${sessionId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify({ message }),
      }
    );
  }

  async getChatHistory(sessionId: string): Promise<{
    sessionId: string;
    messages: Array<{ role: 'user' | 'model'; text: string; timestamp: Date }>;
    persona: string;
  }> {
    return this.request(`/chat/sessions/${sessionId}`, {
      method: 'GET',
    });
  }

  async deleteChatSession(sessionId: string): Promise<void> {
    await this.request<void>(`/chat/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  }
}

export default new ApiService();
