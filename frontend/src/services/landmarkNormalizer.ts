/**
 * SignBridge AI - Client-Side Landmark Normalizer
 * Computes 84-dimensional scale- and translation-invariant geometric features from 21 3D hand landmarks.
 */

import { LandmarkPoint } from '../types';

export class ClientLandmarkNormalizer {
  // Key landmark indices matching Python normalizer
  private static FINGERTIP_INDICES = [4, 8, 12, 16, 20]; // Thumb, Index, Middle, Ring, Pinky
  private static MCP_INDICES = [1, 5, 9, 13, 17];

  public static normalizeLandmarks(landmarks: LandmarkPoint[]): Float32Array {
    if (landmarks.length !== 21) {
      throw new Error(`Expected 21 landmarks, received ${landmarks.length}`);
    }

    // Step 1: Translation Invariance - Shift origin to Landmark 0 (Wrist)
    const wrist = landmarks[0];
    const centered: { x: number; y: number; z: number }[] = [];
    let maxDist = 0;

    for (let i = 0; i < 21; i++) {
      const lm = landmarks[i];
      const dx = lm.x - wrist.x;
      const dy = lm.y - wrist.y;
      const dz = (lm.z || 0) - (wrist.z || 0);
      centered.push({ x: dx, y: dy, z: dz });

      if (i > 0) {
        const dist = Math.hypot(dx, dy, dz);
        if (dist > maxDist) maxDist = dist;
      }
    }

    // Step 2: Scale Invariance - Normalize by maximum Euclidean distance
    const scaleFactor = maxDist > 1e-6 ? maxDist : 1.0;
    const normalized: { x: number; y: number; z: number }[] = centered.map(pt => ({
      x: pt.x / scaleFactor,
      y: pt.y / scaleFactor,
      z: pt.z / scaleFactor
    }));

    // Output feature vector array (84 elements)
    const features = new Float32Array(84);
    let offset = 0;

    // 1. 21 * 3 = 63 normalized coordinates
    for (let i = 0; i < 21; i++) {
      features[offset++] = normalized[i].x;
      features[offset++] = normalized[i].y;
      features[offset++] = normalized[i].z;
    }

    // 2. 5 Fingertip-to-Wrist distances
    for (const tipIdx of this.FINGERTIP_INDICES) {
      const tip = normalized[tipIdx];
      features[offset++] = Math.hypot(tip.x, tip.y, tip.z);
    }

    // 3. 4 Adjacent Fingertip-to-Fingertip distances
    for (let i = 0; i < 4; i++) {
      const tipA = normalized[this.FINGERTIP_INDICES[i]];
      const tipB = normalized[this.FINGERTIP_INDICES[i + 1]];
      features[offset++] = Math.hypot(tipA.x - tipB.x, tipA.y - tipB.y, tipA.z - tipB.z);
    }

    // 4. 4 Tip-to-Thumb distances
    const thumbTip = normalized[4];
    for (const idx of [8, 12, 16, 20]) {
      const tip = normalized[idx];
      features[offset++] = Math.hypot(tip.x - thumbTip.x, tip.y - thumbTip.y, tip.z - thumbTip.z);
    }

    // 5. 5 Finger Extension Ratios (MCP to Tip distance)
    for (let i = 0; i < 5; i++) {
      const tip = normalized[this.FINGERTIP_INDICES[i]];
      const mcp = normalized[this.MCP_INDICES[i]];
      features[offset++] = Math.hypot(tip.x - mcp.x, tip.y - mcp.y, tip.z - mcp.z);
    }

    // 6. 3 Palm aspect & width features
    const p5 = normalized[5];
    const p17 = normalized[17];
    const p9 = normalized[9];
    const palmWidth = Math.hypot(p5.x - p17.x, p5.y - p17.y, p5.z - p17.z);
    const palmHeight = Math.hypot(p9.x, p9.y, p9.z);
    const palmRatio = palmWidth / (palmHeight + 1e-6);

    features[offset++] = palmWidth;
    features[offset++] = palmHeight;
    features[offset++] = palmRatio;

    return features;
  }
}
