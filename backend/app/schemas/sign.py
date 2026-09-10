"""
SignBridge AI - API Pydantic Schemas
"""

from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field


class LandmarkPoint(BaseModel):
    x: float = Field(..., description="Normalized X coordinate in image plane [0.0, 1.0]")
    y: float = Field(..., description="Normalized Y coordinate in image plane [0.0, 1.0]")
    z: Optional[float] = Field(0.0, description="Normalized 3D depth relative to wrist")


class PredictionRequest(BaseModel):
    landmarks: List[LandmarkPoint] = Field(
        ...,
        min_length=21,
        max_length=21,
        description="List of exactly 21 MediaPipe hand landmarks"
    )
    confidence_threshold: Optional[float] = Field(0.70, ge=0.0, le=1.0)
    top_k: Optional[int] = Field(3, ge=1, le=13)


class TopPrediction(BaseModel):
    sign: str
    confidence: float


class PredictionResponse(BaseModel):
    sign: str
    raw_prediction: str
    confidence: float
    is_confident: bool
    top_predictions: List[TopPrediction]
    feature_dim: int


class VocabularyItem(BaseModel):
    id: str
    name: str
    category: str
    hand_type: str
    description: str


class VocabularyResponse(BaseModel):
    target_language: str
    total_signs: int
    vocabulary: List[VocabularyItem]


class HealthResponse(BaseModel):
    status: str
    version: str
    model_loaded: bool
    vocabulary_size: int
    timestamp: str


class MetricsResponse(BaseModel):
    model_name: str
    timestamp: str
    test_accuracy: float
    macro_f1: float
    macro_precision: float
    macro_recall: float
    mean_latency_ms: float
    p95_latency_ms: float
    per_class_metrics: Dict[str, Any]
    confusion_matrix: List[List[int]]
