/**
 * SignBridge AI - TypeScript Type Definitions
 */

export interface LandmarkPoint {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

export interface TopPrediction {
  sign: string;
  confidence: number;
}

export interface PredictionResult {
  sign: string;
  rawPrediction: string;
  confidence: number;
  isConfident: boolean;
  topPredictions: TopPrediction[];
  featureDim?: number;
}

export interface VocabularyItem {
  id: string;
  name: string;
  category: string;
  hand_type: string;
  description: string;
}

export interface ModelMetrics {
  model_name: string;
  timestamp: string;
  test_accuracy: number;
  macro_f1: number;
  macro_precision: number;
  macro_recall: number;
  mean_latency_ms: number;
  p95_latency_ms: number;
  rf_test_accuracy: number;
  per_class_metrics: Record<string, {
    precision: number;
    recall: number;
    f1: number;
    support: number;
  }>;
  confusion_matrix: number[][];
}

export interface WebModelWeights {
  architecture: string;
  input_dim: number;
  classes: string[];
  scaler_mean: number[];
  scaler_scale: number[];
  weights: number[][][];
  biases: number[][];
  activations: string[];
}

export interface CameraState {
  isActive: boolean;
  isMirror: boolean;
  showLandmarks: boolean;
  deviceId: string | null;
  availableDevices: MediaDeviceInfo[];
  fps: number;
  error: string | null;
}

export interface SpeechSettings {
  rate: number;
  pitch: number;
  voice: SpeechSynthesisVoice | null;
  autoSpeak: boolean;
}

export type GestureState = 'IDLE' | 'DETECTING' | 'COMMITTED' | 'COOLDOWN';
