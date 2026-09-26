import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface IChatSession extends Document {
  sessionId: string;
  userId?: string;
  productionPlanId: mongoose.Types.ObjectId;
  persona: string;
  messages: IChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>({
  role: { type: String, enum: ['user', 'model'], required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const ChatSessionSchema = new Schema<IChatSession>(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, index: true },
    productionPlanId: { type: Schema.Types.ObjectId, ref: 'ProductionPlan', required: true },
    persona: { type: String, required: true },
    messages: [ChatMessageSchema]
  },
  {
    timestamps: true
  }
);

// Index for faster queries
ChatSessionSchema.index({ sessionId: 1, createdAt: -1 });
ChatSessionSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<IChatSession>('ChatSession', ChatSessionSchema);

