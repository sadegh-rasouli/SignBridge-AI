"""
SignBridge AI - Model Training & Serialization Engine
Trains Multi-Layer Perceptron (MLP) and Random Forest models on landmark features.
Exports models to joblib for backend API and JSON weights for browser client-side inference.
"""

from typing import Dict, Any
import json
import os
import time
import joblib
import numpy as np
from sklearn.neural_network import MLPClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix

from ml.data.dataset_generator import generate_dataset, VOCABULARY


def train_models(data_dir: str = "ml/data/processed", models_dir: str = "ml/models", frontend_assets_dir: str = "frontend/src/assets/model", force_regenerate: bool = True) -> Dict[str, Any]:
    os.makedirs(models_dir, exist_ok=True)
    os.makedirs(frontend_assets_dir, exist_ok=True)
    
    # Generate fresh subject-partitioned dataset with 3D augmentations
    train_feat_path = os.path.join(data_dir, "train_features.npy")
    if force_regenerate or not os.path.exists(train_feat_path):
        print("Generating fresh 3D-augmented subject-partitioned dataset...")
        X_train, y_train, X_val, y_val, X_test, y_test = generate_dataset(
            samples_per_class_per_subject=150,
            output_dir=data_dir
        )
    else:
        X_train = np.load(os.path.join(data_dir, "train_features.npy"))
        y_train = np.load(os.path.join(data_dir, "train_labels.npy"))
        X_val = np.load(os.path.join(data_dir, "val_features.npy"))
        y_val = np.load(os.path.join(data_dir, "val_labels.npy"))
        X_test = np.load(os.path.join(data_dir, "test_features.npy"))
        y_test = np.load(os.path.join(data_dir, "test_labels.npy"))

    print(f"Training on {len(X_train)} samples across {len(VOCABULARY)} classes...")

    # Step 1: Fit Standard Scaler on TRAIN set only (strictly preventing data leakage)
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_val_scaled = scaler.transform(X_val)
    X_test_scaled = scaler.transform(X_test)

    # Step 2: Train Multi-Layer Perceptron (MLP) Model
    print("Fitting MLP Neural Classifier [84 -> 128 -> 64 -> 32 -> 13]...")
    mlp = MLPClassifier(
        hidden_layer_sizes=(128, 64, 32),
        activation="relu",
        solver="adam",
        alpha=0.001,
        batch_size=32,
        learning_rate_init=0.002,
        max_iter=500,
        random_state=42,
        early_stopping=True,
        validation_fraction=0.15,
        n_iter_no_change=20
    )
    start_time = time.time()
    mlp.fit(X_train_scaled, y_train)
    mlp_train_time = time.time() - start_time

    # Step 3: Train Random Forest Benchmark
    print("Fitting Random Forest Benchmark Classifier...")
    rf = RandomForestClassifier(
        n_estimators=120,
        max_depth=18,
        random_state=42,
        n_jobs=-1
    )
    rf.fit(X_train_scaled, y_train)

    # Step 4: Evaluate Models on Unseen Test Subject (Subject 8)
    mlp_val_preds = mlp.predict(X_val_scaled)
    mlp_test_preds = mlp.predict(X_test_scaled)
    mlp_test_probs = mlp.predict_proba(X_test_scaled)

    rf_test_preds = rf.predict(X_test_scaled)

    # Calculate Test Metrics for MLP
    test_acc = float(accuracy_score(y_test, mlp_test_preds))
    precision, recall, f1, support = precision_recall_fscore_support(
        y_test, mlp_test_preds, labels=list(range(len(VOCABULARY))), zero_division=0
    )
    conf_mat = confusion_matrix(y_test, mlp_test_preds, labels=list(range(len(VOCABULARY))))

    # Latency Benchmark (500 single-sample inferences)
    single_sample = X_test_scaled[0:1]
    latencies = []
    for _ in range(500):
        t0 = time.perf_counter()
        _ = mlp.predict_proba(single_sample)
        latencies.append((time.perf_counter() - t0) * 1000.0)  # in ms
    mean_latency_ms = float(np.mean(latencies))
    p95_latency_ms = float(np.percentile(latencies, 95))

    metrics_summary = {
        "model_name": "SignBridge-MLP-v1.1-HighPrecision",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "test_accuracy": round(test_acc, 4),
        "macro_f1": round(float(np.mean(f1)), 4),
        "macro_precision": round(float(np.mean(precision)), 4),
        "macro_recall": round(float(np.mean(recall)), 4),
        "mean_latency_ms": round(mean_latency_ms, 3),
        "p95_latency_ms": round(p95_latency_ms, 3),
        "rf_test_accuracy": round(float(accuracy_score(y_test, rf_test_preds)), 4),
        "per_class_metrics": {
            VOCABULARY[i]: {
                "precision": round(float(precision[i]), 4),
                "recall": round(float(recall[i]), 4),
                "f1": round(float(f1[i]), 4),
                "support": int(support[i])
            }
            for i in range(len(VOCABULARY))
        },
        "confusion_matrix": conf_mat.tolist()
    }

    # Step 5: Save Backend Models (joblib)
    joblib.dump(mlp, os.path.join(models_dir, "signbridge_mlp.joblib"))
    joblib.dump(scaler, os.path.join(models_dir, "signbridge_scaler.joblib"))
    joblib.dump(rf, os.path.join(models_dir, "signbridge_rf.joblib"))

    # Step 6: Export Browser-Ready Web Weights JSON
    web_model_weights = {
        "architecture": "MLP",
        "input_dim": 84,
        "classes": VOCABULARY,
        "scaler_mean": scaler.mean_.tolist(),
        "scaler_scale": scaler.scale_.tolist(),
        "weights": [coef.tolist() for coef in mlp.coefs_],
        "biases": [intercept.tolist() for intercept in mlp.intercepts_],
        "activations": ["relu", "relu", "relu", "softmax"]
    }

    # Save to ml/models/
    with open(os.path.join(models_dir, "web_model.json"), "w") as f:
        json.dump(web_model_weights, f)

    class_map = {str(i): name for i, name in enumerate(VOCABULARY)}
    with open(os.path.join(models_dir, "class_map.json"), "w") as f:
        json.dump(class_map, f, indent=2)

    with open(os.path.join(models_dir, "metrics_summary.json"), "w") as f:
        json.dump(metrics_summary, f, indent=2)

    # Sync to frontend/src/assets/model/
    if os.path.exists(frontend_assets_dir):
        with open(os.path.join(frontend_assets_dir, "web_model.json"), "w") as f:
            json.dump(web_model_weights, f)
        with open(os.path.join(frontend_assets_dir, "metrics_summary.json"), "w") as f:
            json.dump(metrics_summary, f, indent=2)

    print(f"\n==========================================")
    print(f"Training Complete! Test Accuracy: {test_acc * 100:.2f}% | Macro F1: {np.mean(f1):.4f}")
    print(f"Inference Latency: {mean_latency_ms:.2f} ms (p95: {p95_latency_ms:.2f} ms)")
    print(f"Exported web weights to {os.path.join(models_dir, 'web_model.json')} and {frontend_assets_dir}")
    print(f"==========================================\n")

    return metrics_summary


if __name__ == "__main__":
    train_models()
