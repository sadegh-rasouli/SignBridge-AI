# SignBridge AI — Machine Learning Plan & Evaluation Strategy (Phase 0)

## 1. Machine Learning Strategy & Problem Formulation

### 1.1 Objective
Classify isolated 3D hand landmark coordinate vectors into one of the 12 target ASL vocabulary classes (plus a `NEUTRAL`/`BACKGROUND` non-sign class) with high precision ($\ge 95\%$), low false-positive rate, and latency under 10 milliseconds.

### 1.2 Target Vocabulary Classes
1. `HELLO`
2. `THANK_YOU`
3. `YES`
4. `NO`
5. `PLEASE`
6. `HELP`
7. `STOP`
8. `GOOD`
9. `BAD`
10. `NAME`
11. `ME`
12. `YOU`
13. `NEUTRAL` (Rest / transition pose)

---

## 2. Dataset Strategy & Data Leakage Prevention

### 2.1 Dataset Structure & Organization
To avoid temporal and subject data leakage, data is structured into distinct sessions and subject-independent partitions:
```
ml/data/
├── raw/
│   ├── metadata.json
│   ├── subject_01/
│   │   ├── HELLO/
│   │   ├── YES/
│   │   └── ...
│   ├── subject_02/
│   └── ...
├── processed/
│   ├── train_features.npy
│   ├── train_labels.npy
│   ├── val_features.npy
│   ├── val_labels.npy
│   ├── test_features.npy
│   ├── test_labels.npy
│   └── class_map.json
└── synthetic_augmented/
```

### 2.2 Strict Data Partitioning Rules
- **Subject-Independent Split:** Subjects 01–06 allocated to `train` (70%), Subject 07 to `val` (15%), Subject 08 to `test` (15%). No frames from the same recording session or subject appear in both training and test sets.
- **Normalization Fitted Exclusively on Train:** Feature scalers, standardizers, or PCA transformations are fit exclusively on the training split and applied to validation/test splits.
- **Controlled Geometric Augmentation:**
  - Scale perturbation ($\pm 10\%$)
  - Spatial rotation in the image plane ($\pm 15^\circ$)
  - 3D joint coordinate Gaussian jitter ($\sigma = 0.015$)
  - Handedness mirroring (Left/Right hand adaptation)

---

## 3. Feature Engineering & Preprocessing Pipeline

### 3.1 Normalization Pipeline
1. **Translation Invariance:** Subtract Landmark 0 (Wrist $x_0, y_0, z_0$) from all 21 points.
2. **Scale Invariance:** Compute max distance $S = \max_i \|P'_i - P'_0\|_2$ and divide all vectors by $S$.
3. **Geometric Finger Angles:**
   Compute cosine similarity and Euclidean distance for finger joints (MCP $\rightarrow$ PIP $\rightarrow$ DIP $\rightarrow$ TIP) across Thumb, Index, Middle, Ring, and Pinky.
4. **Feature Vector:**
   - 63 Normalized Cartesian Coordinates $[x_0..x_{20}, y_0..y_{20}, z_0..z_{20}]$
   - 21 Inter-landmark distances (fingertip-to-wrist, fingertip-to-thumb, adjacent fingertip spans)
   - Total dimensionality: $D = 84$ features per frame.

---

## 4. Model Architectures & Selection

We implement and compare two distinct model architectures:

### 4.1 Baseline: Regularized Random Forest & Multi-Layer Perceptron (Scikit-Learn)
- **Random Forest:** 150 estimators, max depth 15, balanced class weighting. Provides strong non-linear boundary separation with minimal hyperparameter sensitivity and zero GPU requirements.
- **MLP Classifier:** $[84 \rightarrow 128 \rightarrow 64 \rightarrow 32 \rightarrow 13]$ with ReLU activations, Batch Normalization / Dropout ($p=0.2$), and Adam optimizer with $L_2$ weight decay ($10^{-4}$).

### 4.2 Deep Neural Model: LandmarkNet (PyTorch)
- **Architecture:**
  - Input: $D = 84$
  - Layer 1: Linear(84, 128) + BatchNorm1d + Mish + Dropout(0.25)
  - Layer 2: Residual Block [Linear(128, 128) + Mish + Dropout(0.2) + Linear(128, 128)] + Skip Connection
  - Layer 3: Linear(128, 64) + Mish + Dropout(0.15)
  - Output: Linear(64, 13) + Softmax
- **Loss:** Focal Loss / Label Smoothing Cross-Entropy ($p_{smooth} = 0.05$) to handle subtle class boundary similarities (e.g., `GOOD` vs `BAD` handshapes).

### 4.3 Client-Side Export (Web Inference)
- Export to **ONNX format** (`model.onnx`) and lightweight JSON/TypedArray weights for zero-dependency high-speed in-browser evaluation with sub-3ms latency.

---

## 5. Comprehensive Evaluation & Reporting

Evaluation will never report single-number accuracy alone. The evaluation suite computes and generates:
1. **Multi-Class Confusion Matrix** (Normalized and raw counts).
2. **Per-Class Metrics:**
   - Precision
   - Recall
   - F1-Score
   - Support counts
3. **Macro and Weighted F1-Scores**.
4. **Inference Latency Profiling:**
   - Mean, p50, p95, p99 latency in milliseconds across 1,000 synthetic batches.
5. **Confidence Calibration Curves:** Expected Calibration Error (ECE) to verify probability reliability.

---

## 6. Reproducibility & Model Artifacts

- All random seeds fixed (`SEED = 42`).
- Saved artifacts:
  - `ml/models/signbridge_landmark_net.pt` (PyTorch weights)
  - `ml/models/signbridge_classifier.joblib` (Scikit-learn model + scaler)
  - `ml/models/signbridge_model.onnx` (ONNX export)
  - `ml/models/class_map.json` (ID to Sign Token dictionary)
  - `ml/models/metrics_summary.json` (Evaluation report)
