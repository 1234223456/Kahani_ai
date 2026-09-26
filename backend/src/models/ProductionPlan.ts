import mongoose, { Schema, Document } from 'mongoose';

export interface IScene {
  scene: number;
  title: string;
  dialog: string;
}

export interface IKeyframe {
  keyframe: number;
  scene: number;
  prompt: string;
}

export interface IVideoClip {
  clip: number;
  input: string;
  prompt: string;
}

export interface IProductionPlan extends Document {
  userId?: string;
  characterModel: {
    source: string;
    action: string;
  };
  storyAnalysis: {
    hero: string;
    parentPrompt: string;
    coreLesson: string;
    villain: string;
    characterArc: string;
    characterPersona: string;
  };
  episodeScript: {
    action: string;
    scenes: IScene[];
  };
  staticKeyframes: {
    action: string;
    keyframes: IKeyframe[];
  };
  videoGeneration: {
    action: string;
    clips: IVideoClip[];
  };
  postProcessing: {
    action: string;
  };
  language: string;
  drawingDescription: string;
  parentPrompt: string;
  characterImage?: string;
  generatedAssets?: {
    characterModelImage?: string;
    keyframeImages?: string[];
    videoUrls?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const SceneSchema = new Schema<IScene>({
  scene: { type: Number, required: true },
  title: { type: String, required: true },
  dialog: { type: String, required: true }
});

const KeyframeSchema = new Schema<IKeyframe>({
  keyframe: { type: Number, required: true },
  scene: { type: Number, required: true },
  prompt: { type: String, required: true }
});

const VideoClipSchema = new Schema<IVideoClip>({
  clip: { type: Number, required: true },
  input: { type: String, required: true },
  prompt: { type: String, required: true }
});

const ProductionPlanSchema = new Schema<IProductionPlan>(
  {
    userId: { type: String, index: true },
    characterModel: {
      source: { type: String, required: true },
      action: { type: String, required: true }
    },
    storyAnalysis: {
      hero: { type: String, required: true },
      parentPrompt: { type: String, required: true },
      coreLesson: { type: String, required: true },
      villain: { type: String, required: true },
      characterArc: { type: String, required: true },
      characterPersona: { type: String, required: true }
    },
    episodeScript: {
      action: { type: String, required: true },
      scenes: [SceneSchema]
    },
    staticKeyframes: {
      action: { type: String, required: true },
      keyframes: [KeyframeSchema]
    },
    videoGeneration: {
      action: { type: String, required: true },
      clips: [VideoClipSchema]
    },
    postProcessing: {
      action: { type: String, required: true }
    },
    language: { type: String, required: true, default: 'English' },
    drawingDescription: { type: String, required: true },
    parentPrompt: { type: String, required: true },
    characterImage: { type: String },
    generatedAssets: {
      characterModelImage: { type: String },
      keyframeImages: [{ type: String }],
      videoUrls: [{ type: String }]
    }
  },
  {
    timestamps: true
  }
);

// Index for faster queries
ProductionPlanSchema.index({ createdAt: -1 });
ProductionPlanSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<IProductionPlan>('ProductionPlan', ProductionPlanSchema);
