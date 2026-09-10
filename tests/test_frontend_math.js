/**
 * SignBridge AI - Node.js Frontend Engine Validation Test
 * Validates that the JavaScript/TypeScript client normalization & forward pass outputs match expected predictions.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Load weights
const weightsPath = path.join(__dirname, '../ml/models/web_model.json');
const weightsData = JSON.parse(fs.readFileSync(weightsPath, 'utf8'));

// Canonical HELLO landmark template
const HELLO_LANDMARKS = [
  { x: 0.50, y: 0.85, z: 0.00 },
  { x: 0.42, y: 0.75, z: -0.02 },
  { x: 0.36, y: 0.65, z: -0.04 },
  { x: 0.32, y: 0.58, z: -0.06 },
  { x: 0.28, y: 0.52, z: -0.08 },
  { x: 0.45, y: 0.58, z: -0.02 },
  { x: 0.44, y: 0.44, z: -0.03 },
  { x: 0.43, y: 0.33, z: -0.04 },
  { x: 0.42, y: 0.22, z: -0.05 },
  { x: 0.50, y: 0.57, z: -0.01 },
  { x: 0.50, y: 0.42, z: -0.02 },
  { x: 0.50, y: 0.30, z: -0.03 },
  { x: 0.50, y: 0.18, z: -0.04 },
  { x: 0.55, y: 0.58, z: -0.01 },
  { x: 0.56, y: 0.45, z: -0.02 },
  { x: 0.57, y: 0.34, z: -0.03 },
  { x: 0.58, y: 0.24, z: -0.04 },
  { x: 0.60, y: 0.62, z: -0.01 },
  { x: 0.62, y: 0.52, z: -0.02 },
  { x: 0.64, y: 0.44, z: -0.03 },
  { x: 0.66, y: 0.36, z: -0.04 }
];

function normalizeLandmarks(landmarks) {
  const wrist = landmarks[0];
  const centered = [];
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

  const scaleFactor = maxDist > 1e-6 ? maxDist : 1.0;
  const normalized = centered.map(pt => ({
    x: pt.x / scaleFactor,
    y: pt.y / scaleFactor,
    z: pt.z / scaleFactor
  }));

  const features = new Float32Array(84);
  let offset = 0;

  for (let i = 0; i < 21; i++) {
    features[offset++] = normalized[i].x;
    features[offset++] = normalized[i].y;
    features[offset++] = normalized[i].z;
  }

  const FINGERTIP_INDICES = [4, 8, 12, 16, 20];
  const MCP_INDICES = [1, 5, 9, 13, 17];

  for (const tipIdx of FINGERTIP_INDICES) {
    const tip = normalized[tipIdx];
    features[offset++] = Math.hypot(tip.x, tip.y, tip.z);
  }

  for (let i = 0; i < 4; i++) {
    const tipA = normalized[FINGERTIP_INDICES[i]];
    const tipB = normalized[FINGERTIP_INDICES[i + 1]];
    features[offset++] = Math.hypot(tipA.x - tipB.x, tipA.y - tipB.y, tipA.z - tipB.z);
  }

  const thumbTip = normalized[4];
  for (const idx of [8, 12, 16, 20]) {
    const tip = normalized[idx];
    features[offset++] = Math.hypot(tip.x - thumbTip.x, tip.y - thumbTip.y, tip.z - thumbTip.z);
  }

  for (let i = 0; i < 5; i++) {
    const tip = normalized[FINGERTIP_INDICES[i]];
    const mcp = normalized[MCP_INDICES[i]];
    features[offset++] = Math.hypot(tip.x - mcp.x, tip.y - mcp.y, tip.z - mcp.z);
  }

  const p5 = normalized[5], p17 = normalized[17], p9 = normalized[9];
  const palmWidth = Math.hypot(p5.x - p17.x, p5.y - p17.y, p5.z - p17.z);
  const palmHeight = Math.hypot(p9.x, p9.y, p9.z);
  const palmRatio = palmWidth / (palmHeight + 1e-6);

  features[offset++] = palmWidth;
  features[offset++] = palmHeight;
  features[offset++] = palmRatio;

  return features;
}

function scaleFeatures(raw) {
  const mean = weightsData.scaler_mean;
  const scale = weightsData.scaler_scale;
  const scaled = new Float32Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    scaled[i] = (raw[i] - mean[i]) / (scale[i] || 1.0);
  }
  return scaled;
}

function linear(input, weights, biases, relu = true) {
  const out = new Float32Array(biases.length);
  for (let j = 0; j < biases.length; j++) {
    let sum = biases[j];
    for (let i = 0; i < input.length; i++) {
      sum += input[i] * weights[i][j];
    }
    out[j] = relu ? Math.max(0, sum) : sum;
  }
  return out;
}

function softmax(logits) {
  let max = -Infinity;
  for (let i = 0; i < logits.length; i++) if (logits[i] > max) max = logits[i];
  let sum = 0;
  const exp = new Float32Array(logits.length);
  for (let i = 0; i < logits.length; i++) {
    exp[i] = Math.exp(logits[i] - max);
    sum += exp[i];
  }
  return exp.map(v => v / (sum + 1e-9));
}

function runTest() {
  console.log('Testing JS Normalization & Forward Pass...');
  const features = normalizeLandmarks(HELLO_LANDMARKS);
  assert.strictEqual(features.length, 84, 'Feature length must be 84');

  const scaled = scaleFeatures(features);
  const l1 = linear(scaled, weightsData.weights[0], weightsData.biases[0], true);
  const l2 = linear(l1, weightsData.weights[1], weightsData.biases[1], true);
  const l3 = linear(l2, weightsData.weights[2], weightsData.biases[2], true);
  const logits = linear(l3, weightsData.weights[3], weightsData.biases[3], false);
  const probs = softmax(logits);

  const bestIdx = probs.indexOf(Math.max(...probs));
  const bestClass = weightsData.classes[bestIdx];
  const bestConfidence = probs[bestIdx];

  console.log(`Prediction for canonical HELLO: ${bestClass} (Confidence: ${(bestConfidence * 100).toFixed(2)}%)`);
  assert.strictEqual(bestClass, 'HELLO', 'Prediction must be HELLO');
  assert.ok(bestConfidence > 0.70, 'Confidence must be > 70%');
  console.log('✓ JS Neural Forward Pass Passed 100%!');
}

runTest();
