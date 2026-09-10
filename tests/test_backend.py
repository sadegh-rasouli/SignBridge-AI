"""
Integration tests for SignBridge AI FastAPI Endpoints
"""

from fastapi.testclient import TestClient
import pytest
from backend.app.main import app
from ml.data.dataset_generator import CANONICAL_HAND_POSES

client = TestClient(app)


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["project"] == "SignBridge AI"
    assert data["version"] == "1.0.0-MVP"


def test_health_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["model_loaded"] is True
    assert data["vocabulary_size"] == 13


def test_vocabulary_endpoint():
    response = client.get("/api/v1/vocabulary")
    assert response.status_code == 200
    data = response.json()
    assert data["target_language"] == "American Sign Language (ASL)"
    assert data["total_signs"] == 12
    assert len(data["vocabulary"]) == 12
    # Verify presence of essential vocabulary
    sign_ids = [item["id"] for item in data["vocabulary"]]
    assert "HELLO" in sign_ids
    assert "THANK_YOU" in sign_ids
    assert "YES" in sign_ids
    assert "HELP" in sign_ids


def test_predict_endpoint_success():
    hello_landmarks = CANONICAL_HAND_POSES["HELLO"]
    payload = {
        "landmarks": [{"x": float(row[0]), "y": float(row[1]), "z": float(row[2])} for row in hello_landmarks],
        "confidence_threshold": 0.60,
        "top_k": 3
    }
    response = client.post("/api/v1/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["sign"] == "HELLO"
    assert data["confidence"] >= 0.60
    assert len(data["top_predictions"]) == 3
    assert data["feature_dim"] == 84


def test_predict_endpoint_validation_error():
    # Only 5 landmarks instead of required 21
    invalid_payload = {
        "landmarks": [{"x": 0.5, "y": 0.5, "z": 0.0} for _ in range(5)],
        "confidence_threshold": 0.70
    }
    response = client.post("/api/v1/predict", json=invalid_payload)
    assert response.status_code == 422  # Unprocessable Entity


def test_metrics_endpoint():
    response = client.get("/api/v1/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "test_accuracy" in data
    assert data["test_accuracy"] > 0.90
    assert "macro_f1" in data
    assert "confusion_matrix" in data
    assert "mean_latency_ms" in data
