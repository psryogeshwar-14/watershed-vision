"""
WatershedVision ML Models Package
"""

from .inference import classify_image, get_classifier, WatershedImageClassifier

__all__ = ["classify_image", "get_classifier", "WatershedImageClassifier"]
