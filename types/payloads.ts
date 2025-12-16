import { SupportedLanguage } from "./sign-languages";

export type Landmark = { 
  x: number; 
  y: number; 
  z: number;
  visibility?: number;
  presence?: number;
};

export type HolisticResults = {
  multiHandLandmarks?: Landmark[][];
  poseWorldLandmarks?: Landmark[];
  poseLandmarks?: Landmark[];
  faceLandmarks?: Landmark[];
  multiHandedness?: { index: number; label: string; score: number }[];
};

export type GesturePayload = {
  language: SupportedLanguage;
  hands?: number[][][];
  pose?: number[][];
  timestamp: number;
};

