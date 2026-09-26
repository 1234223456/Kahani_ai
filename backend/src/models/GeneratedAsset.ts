import mongoose, { Schema, Document } from 'mongoose';

export interface IGeneratedAsset extends Document {
  productionPlanId: mongoose.Types.ObjectId;
  assetType: 'character_model' | 'keyframe' | 'video';
  assetIndex?: number; // For keyframes and videos (0-based index)
  url?: string; // For storing video URLs
  data?: string; // For storing base64 image data
  mimeType?: string;
  prompt?: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const GeneratedAssetSchema = new Schema<IGeneratedAsset>(
  {
    productionPlanId: { 
      type: Schema.Types.ObjectId, 
      ref: 'ProductionPlan', 
      required: true 
    },
    assetType: { 
      type: String, 
      enum: ['character_model', 'keyframe', 'video'], 
      required: true 
    },
    assetIndex: { type: Number },
    url: { type: String },
    data: { type: String },
    mimeType: { type: String },
    prompt: { type: String },
    status: { 
      type: String, 
      enum: ['pending', 'generating', 'completed', 'failed'], 
      default: 'pending' 
    },
    errorMessage: { type: String }
  },
  {
    timestamps: true
  }
);

// Index for faster queries
GeneratedAssetSchema.index({ productionPlanId: 1, assetType: 1, assetIndex: 1 });

export default mongoose.model<IGeneratedAsset>('GeneratedAsset', GeneratedAssetSchema);

