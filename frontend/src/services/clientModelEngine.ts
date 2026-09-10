/**
 * SignBridge AI - High-Speed Client-Side Neural Inference Engine
 * Runs MLP forward pass directly in the browser with zero external dependencies.
 */

import { LandmarkPoint, PredictionResult, TopPrediction, WebModelWeights } from '../types';
import { ClientLandmarkNormalizer } from './landmarkNormalizer';
import defaultWeights from '../assets/model/web_model.json';

export class ClientModelEngine {
  private static instance: ClientModelEngine;
  private weightsData: WebModelWeights;

  private constructor() {
    this.weightsData = defaultWeights as unknown as WebModelWeights;
  }

  public static getInstance(): ClientModelEngine {
    if (!ClientModelEngine.instance) {
      ClientModelEngine.instance = new ClientModelEngine();
    }
    return ClientModelEngine.instance;
  }

  /**
   * Performs standard scaling: z = (x - mean) / scale
   */
  private scaleFeatures(rawFeatures: Float32Array): Float32Array {
    const mean = this.weightsData.scaler_mean;
    const scale = this.weightsData.scaler_scale;
    const scaled = new Float32Array(rawFeatures.length);

    for (let i = 0; i < rawFeatures.length; i++) {
      scaled[i] = (rawFeatures[i] - mean[i]) / (scale[i] || 1.0);
    }
    return scaled;
  }

  /**
   * Matrix-vector multiplication and bias addition: y = W^T * x + b
   * with ReLU activation for hidden layers.
   */
  private linearLayer(
    input: Float32Array,
    weights: number[][],
    biases: number[],
    activation: 'relu' | 'none'
  ): Float32Array {
    const inDim = input.length;
    const outDim = biases.length;
    const output = new Float32Array(outDim);

    for (let j = 0; j < outDim; j++) {
      let sum = biases[j];
      for (let i = 0; i < inDim; i++) {
        sum += input[i] * weights[i][j];
      }
      output[j] = activation === 'relu' ? Math.max(0, sum) : sum;
    }
    return output;
  }

  /**
   * Numerically stable Softmax calculation
   */
  private softmax(logits: Float32Array): Float32Array {
    let maxVal = -Infinity;
    for (let i = 0; i < logits.length; i++) {
      if (logits[i] > maxVal) maxVal = logits[i];
    }

    let sumExp = 0;
    const expVals = new Float32Array(logits.length);
    for (let i = 0; i < logits.length; i++) {
      const exp = Math.exp(logits[i] - maxVal);
      expVals[i] = exp;
      sumExp += exp;
    }

    const probs = new Float32Array(logits.length);
    for (let i = 0; i < logits.length; i++) {
      probs[i] = expVals[i] / (sumExp + 1e-9);
    }
    return probs;
  }

  /**
   * Full forward pass: [84 -> 128 (ReLU) -> 64 (ReLU) -> 32 (ReLU) -> 13 (Softmax)]
   */
  public predict(
    landmarks: LandmarkPoint[],
    confidenceThreshold: number = 0.70,
    topK: number = 3
  ): PredictionResult {
    // 1. Extract 84-D normalized geometric features
    const rawFeatures = ClientLandmarkNormalizer.normalizeLandmarks(landmarks);

    // 2. Standardize features
    const scaledFeatures = this.scaleFeatures(rawFeatures);

    // 3. Layer 1: 84 -> 128 (ReLU)
    const layer1 = this.linearLayer(scaledFeatures, this.weightsData.weights[0], this.weightsData.biases[0], 'relu');

    // 4. Layer 2: 128 -> 64 (ReLU)
    const layer2 = this.linearLayer(layer1, this.weightsData.weights[1], this.weightsData.biases[1], 'relu');

    // 5. Layer 3: 64 -> 32 (ReLU)
    const layer3 = this.linearLayer(layer2, this.weightsData.weights[2], this.weightsData.biases[2], 'relu');

    // 6. Layer 4 (Logits): 32 -> 13 (Linear)
    const logits = this.linearLayer(layer3, this.weightsData.weights[3], this.weightsData.biases[3], 'none');

    // 7. Softmax Probabilities
    const probs = this.softmax(logits);

    // 8. Rank Top-K
    const indexedProbs: { sign: string; confidence: number; index: number }[] = [];
    for (let i = 0; i < probs.length; i++) {
      indexedProbs.push({
        sign: this.weightsData.classes[i],
        confidence: Number(probs[i].toFixed(4)),
        index: i
      });
    }

    indexedProbs.sort((a, b) => b.confidence - a.confidence);

    const best = indexedProbs[0];
    const isConfident = best.confidence >= confidenceThreshold && best.sign !== 'NEUTRAL';

    const topPredictions: TopPrediction[] = indexedProbs.slice(0, topK).map(p => ({
      sign: p.sign,
      confidence: p.confidence
    }));

    return {
      sign: isConfident ? best.sign : 'UNCERTAIN',
      rawPrediction: best.sign,
      confidence: best.confidence,
      isConfident,
      topPredictions,
      featureDim: rawFeatures.length
    };
  }
}
