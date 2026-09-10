"""
SignBridge AI - Landmark Inference Pipeline
Handles normalization, model execution, top-k ranking, and confidence scoring.
"""

from typing import List, Dict, Any, Optional
import json
import os
import joblib
import numpy as np

from ml.preprocessing.normalizer import LandmarkNormalizer
from ml.data.dataset_generator import VOCABULARY


class SignClassifierPipeline:
    def __init__(self, models_dir: str = "ml/models"):
        self.normalizer = LandmarkNormalizer()
        self.models_dir = models_dir
        self.model = None
        self.scaler = None
        self.class_map = VOCABULARY
        self.load_model()

    def load_model(self):
        mlp_path = os.path.join(self.models_dir, "signbridge_mlp.joblib")
        scaler_path = os.path.join(self.models_dir, "signbridge_scaler.joblib")
        class_map_path = os.path.join(self.models_dir, "class_map.json")

        if os.path.exists(mlp_path) and os.path.exists(scaler_path):
            self.model = joblib.load(mlp_path)
            self.scaler = joblib.load(scaler_path)
            if os.path.exists(class_map_path):
                with open(class_map_path, "r") as f:
                    cmap_dict = json.load(f)
                    self.class_map = [cmap_dict[str(i)] for i in range(len(cmap_dict))]
        else:
            print("Model weights not found. Will train on-demand.")

    def predict(
        self,
        landmarks: List[Dict[str, float]] | np.ndarray,
        confidence_threshold: float = 0.70,
        top_k: int = 3
    ) -> Dict[str, Any]:
        """
        Runs inference on raw 21 landmark points.
        """
        if self.model is None or self.scaler is None:
            raise RuntimeError("Model is not loaded. Train the model first.")

        # Extract normalized 84-dimensional features
        features = self.normalizer.normalize_landmarks(landmarks)
        features_scaled = self.scaler.transform(features.reshape(1, -1))

        # Softmax probabilities
        probabilities = self.model.predict_proba(features_scaled)[0]
        top_indices = np.argsort(probabilities)[::-1][:top_k]

        top_predictions = [
            {
                "sign": self.class_map[idx],
                "confidence": round(float(probabilities[idx]), 4)
            }
            for idx in top_indices
        ]

        best_idx = top_indices[0]
        best_sign = self.class_map[best_idx]
        best_confidence = float(probabilities[best_idx])

        is_confident = (best_confidence >= confidence_threshold) and (best_sign != "NEUTRAL")

        return {
            "sign": best_sign if is_confident else "UNCERTAIN",
            "raw_prediction": best_sign,
            "confidence": round(best_confidence, 4),
            "is_confident": is_confident,
            "top_predictions": top_predictions,
            "feature_dim": len(features)
        }
