import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface IChatHistory extends Document {
  productionPlanId: mongoose.Types.ObjectId;
  sessionId: string;
  messages: IChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>({
  role: { type: String, enum: ['user', 'model'], required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const ChatHistorySchema = new Schema<IChatHistory>(
  {
    productionPlanId: { 
      type: Schema.Types.ObjectId, 
      ref: 'ProductionPlan', 
      required: true 
    },
    sessionId: { type: String, required: true },
    messages: [ChatMessageSchema]
  },
  {
    timestamps: true
  }
);

// Index for faster queries
ChatHistorySchema.index({ productionPlanId: 1, sessionId: 1 });

export default mongoose.model<IChatHistory>('ChatHistory', ChatHistorySchema);

