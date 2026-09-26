
export enum Language {
    ENGLISH = 'English',
    HINDI = 'Hindi',
}

export interface CharacterModel {
    source: string;
    action: string;
}

export interface StoryAnalysis {
    hero: string;
    parentPrompt: string;
    coreLesson: string;
    villain: string;
    characterArc: string;
    characterPersona: string;
}

export interface Scene {
    scene: number;
    title: string;
    dialog: string;
}

export interface EpisodeScript {
    action: string;
    scenes: Scene[];
}

export interface Keyframe {
    keyframe: number;
    scene: number;
    prompt: string;
}

export interface StaticKeyframes {
    action: string;
    keyframes: Keyframe[];
}

export interface VideoClip {
    clip: number;
    input: string;
    prompt: string;
}

export interface VideoGeneration {
    action: string;
    clips: VideoClip[];
}

export interface PostProcessing {
    action: string;
}

export interface ProductionPlan {
    characterModel: CharacterModel;
    storyAnalysis: StoryAnalysis;
    episodeScript: EpisodeScript;
    staticKeyframes: StaticKeyframes;
    videoGeneration: VideoGeneration;
    postProcessing: PostProcessing;
}

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}
