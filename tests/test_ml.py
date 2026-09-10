"""
Unit tests for SignBridge AI ML Normalization, Dataset & Inference Pipeline
"""

import os
import numpy as np
import pytest
from ml.preprocessing.normalizer import LandmarkNormalizer
from ml.data.dataset_generator import CANONICAL_HAND_POSES, VOCABULARY, apply_subject_variation
from ml.inference.pipeline import SignClassifierPipeline


def test_landmark_normalizer_shape_and_invariance():
    normalizer = LandmarkNormalizer()
    pose = CANONICAL_HAND_POSES["HELLO"]
    
    # 1. Output dimensionality must be exactly 84
    feature_vec = normalizer.normalize_landmarks(pose)
    assert feature_vec.shape == (84,), f"Expected shape (84,), got {feature_vec.shape}"
    assert not np.isnan(feature_vec).any(), "Feature vector contains NaN values"

    # 2. Translation Invariance: Shift pose by (10, 20, -5) in 3D space
    shifted_pose = pose + np.array([10.0, 20.0, -5.0], dtype=np.float32)
    shifted_feature_vec = normalizer.normalize_landmarks(shifted_pose)
    
    # Coordinates and distances should be identical after normalization
    np.testing.assert_allclose(feature_vec, shifted_feature_vec, atol=1e-5)

    # 3. Scale Invariance: Scale pose by factor of 3.5
    scaled_pose = pose * 3.5
    scaled_feature_vec = normalizer.normalize_landmarks(scaled_pose)
    np.testing.assert_allclose(feature_vec, scaled_feature_vec, atol=1e-5)


def test_subject_variation_no_nans():
    base_pose = CANONICAL_HAND_POSES["YES"]
    perturbed = apply_subject_variation(base_pose, subject_id=3)
    assert perturbed.shape == (21, 3)
    assert not np.isnan(perturbed).any()


def test_inference_pipeline():
    pipeline = SignClassifierPipeline()
    assert pipeline.model is not None
    assert pipeline.scaler is not None

    # Test prediction on canonical HELLO pose
    hello_pose = CANONICAL_HAND_POSES["HELLO"]
    result = pipeline.predict(hello_pose, confidence_threshold=0.60)

    assert "sign" in result
    assert "confidence" in result
    assert "top_predictions" in result
    assert len(result["top_predictions"]) == 3
    assert result["sign"] == "HELLO"
    assert result["confidence"] > 0.70
    assert result["is_confident"] is True


def test_inference_pipeline_uncertainty_threshold():
    pipeline = SignClassifierPipeline()
    # Random uniform noise as landmarks
    random_noise = np.random.uniform(0, 1, size=(21, 3)).astype(np.float32)
    result = pipeline.predict(random_noise, confidence_threshold=0.99)
    # High threshold should flag low confidence or UNCERTAIN
    assert result["is_confident"] is False or result["sign"] == "UNCERTAIN"
