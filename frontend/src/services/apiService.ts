/**
 * SignBridge AI - Backend API Integration Service
 */

import { LandmarkPoint, PredictionResult, VocabularyItem, ModelMetrics } from '../types';
import localMetrics from '../assets/model/metrics_summary.json';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export class ApiService {
  public static async checkHealth(): Promise<{ status: string; model_loaded: boolean }> {
    try {
      const res = await fetch(`${API_BASE_URL}/health`, { method: 'GET' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return { status: 'offline', model_loaded: false };
    }
  }

  public static async getVocabulary(): Promise<VocabularyItem[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/vocabulary`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.vocabulary;
    } catch {
      // Return built-in ASL catalog fallback
      return [
        { id: "HELLO", name: "Hello", category: "Greeting", hand_type: "1-Hand (Dominant)", description: "Flat-B hand moving outward from temple/forehead in an open greeting." },
        { id: "THANK_YOU", name: "Thank You", category: "Courtesy", hand_type: "1-Hand (Dominant)", description: "Flat hand touches chin/lips and extends forward toward the recipient." },
        { id: "YES", name: "Yes", category: "Affirmation", hand_type: "1-Hand (Dominant)", description: "S-fist nodding up and down from the wrist like a head nod." },
        { id: "NO", name: "No", category: "Negation", hand_type: "1-Hand (Dominant)", description: "Index and middle fingers snapping firmly against the thumb." },
        { id: "PLEASE", name: "Please", category: "Courtesy", hand_type: "1-Hand (Dominant)", description: "Open flat palm rubbing in a circular motion across the center of the chest." },
        { id: "HELP", name: "Help", category: "Assistance", hand_type: "2-Hands / 1-Hand", description: "Dominant A-hand thumbs up fist resting on flat palm lifted upward together." },
        { id: "STOP", name: "Stop", category: "Safety", hand_type: "2-Hands / 1-Hand", description: "Open flat hand chopped decisively down onto the base palm." },
        { id: "GOOD", name: "Good", category: "Evaluation (+)", hand_type: "1-Hand (Dominant)", description: "Flat hand touches chin and moves smoothly downward/forward." },
        { id: "BAD", name: "Bad", category: "Evaluation (-)", hand_type: "1-Hand (Dominant)", description: "Flat hand touches chin then twists down and away decisively." },
        { id: "NAME", name: "Name", category: "Identity", hand_type: "2-Hands / 1-Hand", description: "H-fingers (index and middle together) tapped perpendicularly across base H-fingers." },
        { id: "ME", name: "Me / I", category: "Pronoun (1st)", hand_type: "1-Hand (Dominant)", description: "Index finger pointing inward to touch the signer's chest." },
        { id: "YOU", name: "You", category: "Pronoun (2nd)", hand_type: "1-Hand (Dominant)", description: "Index finger pointing forward toward the conversation partner." }
      ];
    }
  }

  public static async predictRemote(
    landmarks: LandmarkPoint[],
    confidenceThreshold: number = 0.70
  ): Promise<PredictionResult> {
    const res = await fetch(`${API_BASE_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        landmarks,
        confidence_threshold: confidenceThreshold,
        top_k: 3
      })
    });
    if (!res.ok) throw new Error(`Inference API Error: ${res.status}`);
    const data = await res.json();
    return {
      sign: data.sign,
      rawPrediction: data.raw_prediction,
      confidence: data.confidence,
      isConfident: data.is_confident,
      topPredictions: data.top_predictions,
      featureDim: data.feature_dim
    };
  }

  public static async getMetrics(): Promise<ModelMetrics> {
    try {
      const res = await fetch(`${API_BASE_URL}/metrics`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return localMetrics as unknown as ModelMetrics;
    }
  }
}
