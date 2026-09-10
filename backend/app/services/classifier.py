"""
SignBridge AI - Backend Classifier Service Singleton
"""

import os
from ml.inference.pipeline import SignClassifierPipeline
from ml.data.dataset_generator import VOCABULARY

# Singleton instance
_pipeline: SignClassifierPipeline = None


def get_classifier_service() -> SignClassifierPipeline:
    global _pipeline
    if _pipeline is None:
        models_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../ml/models"))
        _pipeline = SignClassifierPipeline(models_dir=models_dir)
    return _pipeline
