"""
SignBridge AI - FastAPI Route Handlers
"""

import time
import json
import os
from fastapi import APIRouter, HTTPException, status
from backend.app.schemas.sign import (
    PredictionRequest,
    PredictionResponse,
    VocabularyResponse,
    VocabularyItem,
    HealthResponse,
    MetricsResponse
)
from backend.app.services.classifier import get_classifier_service
from ml.data.dataset_generator import VOCABULARY

router = APIRouter(prefix="/api/v1", tags=["SignBridge"])

# Rich vocabulary metadata
VOCABULARY_METADATA = [
    {"id": "HELLO", "name": "Hello", "category": "Greeting", "hand_type": "1-Hand (Dominant)", "description": "Flat-B hand moving outward from temple/forehead in an open greeting."},
    {"id": "THANK_YOU", "name": "Thank You", "category": "Courtesy", "hand_type": "1-Hand (Dominant)", "description": "Flat hand touches chin/lips and extends forward toward the recipient."},
    {"id": "YES", "name": "Yes", "category": "Affirmation", "hand_type": "1-Hand (Dominant)", "description": "S-fist nodding up and down from the wrist like a head nod."},
    {"id": "NO", "name": "No", "category": "Negation", "hand_type": "1-Hand (Dominant)", "description": "Index and middle fingers snapping firmly against the thumb."},
    {"id": "PLEASE", "name": "Please", "category": "Courtesy", "hand_type": "1-Hand (Dominant)", "description": "Open flat palm rubbing in a circular motion across the center of the chest."},
    {"id": "HELP", "name": "Help", "category": "Assistance", "hand_type": "2-Hands / 1-Hand", "description": "Dominant A-hand thumbs up fist resting on flat palm lifted upward together."},
    {"id": "STOP", "name": "Stop", "category": "Safety", "hand_type": "2-Hands / 1-Hand", "description": "Open flat hand chopped decisively down onto the base palm."},
    {"id": "GOOD", "name": "Good", "category": "Evaluation (+)", "hand_type": "1-Hand (Dominant)", "description": "Flat hand touches chin and moves smoothly downward/forward."},
    {"id": "BAD", "name": "Bad", "category": "Evaluation (-)", "hand_type": "1-Hand (Dominant)", "description": "Flat hand touches chin then twists down and away decisively."},
    {"id": "NAME", "name": "Name", "category": "Identity", "hand_type": "2-Hands / 1-Hand", "description": "H-fingers (index and middle together) tapped perpendicularly across base H-fingers."},
    {"id": "ME", "name": "Me / I", "category": "Pronoun (1st)", "hand_type": "1-Hand (Dominant)", "description": "Index finger pointing inward to touch the signer's chest."},
    {"id": "YOU", "name": "You", "category": "Pronoun (2nd)", "hand_type": "1-Hand (Dominant)", "description": "Index finger pointing forward toward the conversation partner."}
]


@router.get("/health", response_model=HealthResponse)
def health_check():
    service = get_classifier_service()
    return HealthResponse(
        status="healthy",
        version="1.0.0-MVP",
        model_loaded=service.model is not None,
        vocabulary_size=len(VOCABULARY),
        timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    )


@router.get("/vocabulary", response_model=VocabularyResponse)
def get_vocabulary():
    items = [VocabularyItem(**item) for item in VOCABULARY_METADATA]
    return VocabularyResponse(
        target_language="American Sign Language (ASL)",
        total_signs=len(items),
        vocabulary=items
    )


@router.post("/predict", response_model=PredictionResponse)
def predict_sign(request: PredictionRequest):
    service = get_classifier_service()
    if service.model is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model is not initialized. Please train the model."
        )

    landmarks_data = [lm.model_dump() for lm in request.landmarks]
    result = service.predict(
        landmarks=landmarks_data,
        confidence_threshold=request.confidence_threshold,
        top_k=request.top_k
    )
    return PredictionResponse(**result)


@router.get("/metrics", response_model=MetricsResponse)
def get_metrics():
    metrics_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../ml/models/metrics_summary.json"))
    if not os.path.exists(metrics_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Metrics report not generated yet. Run ML evaluation."
        )
    with open(metrics_path, "r") as f:
        data = json.load(f)
    return MetricsResponse(**data)
