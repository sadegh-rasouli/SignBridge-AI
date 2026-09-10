# SignBridge AI — System Architecture (Phase 0)

## 1. System Overview & Architectural Philosophy

SignBridge AI is built around a **privacy-first, edge-optimized, dual-mode architecture**.

```
+-----------------------------------------------------------------------------------+
|                                CLIENT BROWSER                                     |
|                                                                                   |
|  +--------------------+     +------------------------+     +-------------------+  |
|  | WebRTC MediaStream | --> | MediaPipe Vision (Wasm)| --> | 21 Hand Landmarks |  |
|  | (Camera 720p/30fps)|     | Hand Landmarker 3D     |     | (x, y, z coords)  |  |
|  +--------------------+     +------------------------+     +-------------------+  |
|                                                                      |            |
|                                                                      v            |
|  +--------------------+     +------------------------+     +-------------------+  |
|  | Speech Synthesis   | <-- | Sentence Builder       | <-- | Invariant Normal- |  |
|  | (Web Speech API)   |     | State & History Buffer |     | ization Engine    |  |
|  +--------------------+     +------------------------+     +-------------------+  |
|                                         ^                            |            |
|                                         |                            v            |
|                             +------------------------+     +-------------------+  |
|                             | Temporal State Machine | <-- | ML Classifier     |  |
|                             | (Debounce & Hysteresis)|     | (Edge/Local/API)  |  |
|                             +------------------------+     +-------------------+  |
+-----------------------------------------------------------------------------------+
                                         | (Optional / Verification / Benchmarks)
                                         v
+-----------------------------------------------------------------------------------+
|                               BACKEND (FastAPI / Python)                          |
|                                                                                   |
|  +--------------------+     +------------------------+     +-------------------+  |
|  | REST API Endpoints | --> | PyTorch / Scikit-Learn | --> | Metrics & Health  |  |
|  | /predict, /vocab   |     | Benchmark Inference    |     | Service Logging   |  |
|  +--------------------+     +------------------------+     +-------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 2. Component Breakdown

### 2.1 Frontend Tier (`frontend/`)
- **Technology:** React 19 + TypeScript (strict mode) + Vite + Modern CSS Design System.
- **Key Modules:**
  - `components/camera/CameraFeed.tsx`: Manages `navigator.mediaDevices.getUserMedia`, video canvas, mirroring, landmark skeletal rendering, and FPS monitoring.
  - `components/recognition/LivePredictionCard.tsx`: Real-time predicted token display, confidence score progress bars, top-k distribution, and uncertainty warnings.
  - `components/transcript/SentenceBuilder.tsx`: Live transcript stream, formatting, word deletion, undo/redo, text copy, and TTS invocation.
  - `components/controls/ControlsToolbar.tsx`: Confidence slider, FPS toggles, skeleton overlay toggle, camera selection, and pause/resume triggers.
  - `components/speech-to-sign/SpeechToSignModal.tsx`: Visual preview of reverse translation architecture (Speech → Gloss → Animation).
  - `components/landing/LandingPage.tsx`: Product introduction, ethical limitations, vocabulary reference, tech stack showcase, and accessibility info.
  - `hooks/useCamera.ts`: Resilient webcam lifecycle management and error recovery.
  - `hooks/useHandLandmarks.ts`: MediaPipe Landmarker lifecycle, frame stepping, and coordinate extraction.
  - `hooks/useTemporalSmoothing.ts`: Sliding-window temporal averaging, hysteresis gating, and token debouncing.
  - `hooks/useTextToSpeech.ts`: Web Speech API wrapper with pitch, rate, and voice profile selection.
  - `services/mlInferenceService.ts`: Local client-side neural/classifier inference and fallback backend REST connector.

### 2.2 Machine Learning & Feature Engineering Tier (`ml/`)
- **Technology:** Python 3.14 / NumPy / Scikit-Learn / PyTorch / ONNX.
- **Key Modules:**
  - `ml/preprocessing/normalizer.py`: Translates wrist to $(0,0,0)$, normalizes bounding-sphere radius to $1.0$, and derives geometric angles/distances.
  - `ml/data/dataset_generator.py`: Generates standardized, reproducible landmark datasets across varied lighting, scales, and positional jitter with zero data leakage.
  - `ml/training/train.py`: Trains baseline and deep neural classifiers (MLP, Random Forest, PyTorch LandmarkNet) with stratified group splits.
  - `ml/evaluation/evaluate.py`: Generates confusion matrices, per-class precision/recall/F1, ROC curves, and latency benchmarks.
  - `ml/inference/pipeline.py`: Production-ready inference module that accepts raw landmarks and returns class distributions.

### 2.3 Backend API Tier (`backend/`)
- **Technology:** FastAPI, Uvicorn, Pydantic v2.
- **Key Endpoints:**
  - `GET /api/v1/health`: System status, model version, and uptime.
  - `GET /api/v1/vocabulary`: Supported sign catalog with linguistic descriptions and hand configuration metadata.
  - `POST /api/v1/predict`: Landmark vector validation and backend inference verification.
  - `GET /api/v1/metrics`: Model evaluation summary, benchmark accuracies, and latency stats.
  - `POST /api/v1/feedback`: Optional user feedback on recognition accuracy for continuous quality audits.

---

## 3. Data Flow & Landmark Normalization

### 3.1 Raw Landmark Structure
MediaPipe generates 21 hand landmarks per frame. Each landmark has normalized image coordinates:
$$P_i = (x_i, y_i, z_i), \quad i \in [0, 20]$$
where $P_0$ is the wrist joint.

### 3.2 Invariance Transformation Algorithm
To ensure the classifier is invariant to hand distance (scale) and frame position (translation):
1. **Centering (Translation Invariance):**
   $$P'_i = P_i - P_0, \quad \forall i \in [0, 20]$$
   After translation, $P'_0 = (0, 0, 0)$.
2. **Scale Invariance (Distance Normalization):**
   Compute the maximum Euclidean distance from the wrist to any fingertip landmark:
   $$S = \max_{i=1}^{20} \|P'_i\|_2$$
   Normalize all relative coordinates:
   $$P''_i = \frac{P'_i}{S}, \quad \forall i \in [0, 20]$$
3. **Feature Vector Representation:**
   The normalized coordinates are flattened into a 63-dimensional vector:
   $$\mathbf{X} = [x''_0, y''_0, z''_0, x''_1, y''_1, z''_1, \dots, x''_{20}, y''_{20}, z''_{20}] \in \mathbb{R}^{63}$$
   Additionally, inter-fingertip Euclidean distances and joint flexion angles can be appended to create a robust 84-dimensional feature representation.

---

## 4. Temporal Smoothing & Gesture State Machine

To prevent unstable frame-by-frame flicker and infinite token repeats, we implement a 4-stage hysteresis state machine:

```
                  +-----------------------------------+
                  |               IDLE                |
                  | (No hand or low confidence < Th)  |
                  +-----------------------------------+
                                    |
                 Confidence >= Th   | Hand detected
                                    v
                  +-----------------------------------+
                  |         GESTURE_DETECTING         |
                  |  Buffer filling (N frames window) |
                  +-----------------------------------+
                                    |
               Consistent majority  | Sustained >= MinFrames
               class in window      |
                                    v
                  +-----------------------------------+
                  |          GESTURE_COMMITTED        |
                  |    * EMIT TOKEN TO SENTENCE *     |
                  +-----------------------------------+
                                    |
                                    | Set Cooldown Timer
                                    v
                  +-----------------------------------+
                  |             COOLDOWN              |
                  | Ignore same token until neutral   |
                  | or distinct new gesture detected  |
                  +-----------------------------------+
```

- **Sliding Window:** 10 frames (~330ms at 30 FPS).
- **Confidence Gate:** Default $\ge 0.75$.
- **Trigger Condition:** $80\%$ of frames in sliding window agree on the same class.
- **Debounce:** Requires minimum 600ms or neutral hand transition before re-emitting the same token.

---

## 5. Privacy, Security & Accessibility Architecture

### 5.1 Privacy Guarantees
- Zero server-side video streaming: Video frames exist strictly in browser RAM within canvas elements and are immediately garbage-collected after landmark extraction.
- Client-side inference by default: The model runs locally in the browser. Backend prediction is available as an API validation tool.

### 5.2 Accessibility Guarantees
- Semantic HTML5 structure (`<main>`, `<section>`, `<nav>`, `<article>`).
- ARIA live regions (`aria-live="polite"`, `role="status"`, `role="log"`) for real-time transcription screen-reader announcements.
- Focus trap modals and full keyboard navigation with visible focus rings (`:focus-visible`).
- High-contrast visual tokens compliant with WCAG 2.1 AA.
