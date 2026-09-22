"""
WatershedVision — Image Classifier
===================================
Classifies field geo-coded images into watershed activity categories.

Primary path  : Gemini Vision API (cloud, no local GPU needed)
Fallback path : Rule-based heuristic classifier (offline demo)

Activity categories (aligned with DoLR/IWMP taxonomy):
  - check_dam         : Check dams, gabion structures, nala bunds
  - contour_bund      : Contour trenches, staggered trenches
  - afforestation     : Tree plantation, grass seeding, silvopasture
  - water_body        : Ponds, farm ponds, percolation tanks
  - soil_erosion      : Gully erosion, rill erosion, landslide
  - drainage          : Drainage channels, field channels
  - other             : Any other watershed activity
"""

import os
import base64
import json
import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)


# ── Activity taxonomy ──────────────────────────────────────────────────────
ACTIVITY_TYPES = [
    "check_dam",
    "contour_bund",
    "afforestation",
    "water_body",
    "soil_erosion",
    "drainage",
    "other",
]

ACTIVITY_LABELS = {
    "check_dam": "Check Dam / Gabion Structure",
    "contour_bund": "Contour Bund / Trench",
    "afforestation": "Afforestation / Plantation",
    "water_body": "Water Body / Farm Pond",
    "soil_erosion": "Soil Erosion / Degraded Land",
    "drainage": "Drainage Channel",
    "other": "Other Watershed Activity",
}

# Gemini prompt for watershed image classification
CLASSIFICATION_PROMPT = """You are an expert in watershed development and remote sensing for the Government of India's PMKSY-WDC program.

Analyze this geo-tagged field photograph and classify the primary watershed activity visible.

Choose EXACTLY ONE category from this list:
- check_dam: Check dams, gabion structures, nala bunds, small earthen dams
- contour_bund: Contour bunds, staggered trenches, hillside trenches
- afforestation: Tree plantation, grass seeding, silvopasture, revegetation
- water_body: Farm ponds, percolation tanks, reservoirs, natural water bodies
- soil_erosion: Gully erosion, rill erosion, barren degraded land, landslides
- drainage: Irrigation channels, farm channels, drainage networks
- other: If none of the above apply

Respond in this EXACT JSON format (no markdown, no explanation outside JSON):
{
  "label": "<one of the category keys above>",
  "confidence": <float between 0.0 and 1.0>,
  "display_label": "<human readable label>",
  "description": "<2-3 sentence description of what is visible in the image and its watershed development significance>",
  "condition": "<good|fair|poor - condition of the structure/feature>",
  "recommendations": ["<actionable recommendation 1>", "<actionable recommendation 2>"]
}"""


class WatershedImageClassifier:
    """
    Classifies watershed geo-coded images using Gemini Vision API.
    Falls back to heuristic classification if API is unavailable.
    """

    def __init__(self, gemini_api_key: Optional[str] = None):
        self.api_key = gemini_api_key or os.getenv("GEMINI_API_KEY")
        self._gemini_client = None
        self._load_gemini()

    def _load_gemini(self):
        """Initialize Gemini client if API key is available."""
        if not self.api_key:
            logger.warning(
                "GEMINI_API_KEY not set. Using fallback heuristic classifier."
            )
            return
        try:
            import google.generativeai as genai

            genai.configure(api_key=self.api_key)
            self._gemini_client = genai.GenerativeModel("gemini-1.5-flash")
            logger.info("Gemini Vision client initialized successfully.")
        except ImportError:
            logger.error("google-generativeai not installed. Run: pip install google-generativeai")
        except Exception as e:
            logger.error(f"Failed to initialize Gemini: {e}")

    def classify(self, image_path: str) -> dict:
        """
        Classify a watershed image.

        Args:
            image_path: Path to the image file (JPEG/PNG)

        Returns:
            dict with keys: label, confidence, display_label, description,
                           condition, recommendations, is_mock
        """
        if self._gemini_client:
            try:
                return self._classify_with_gemini(image_path)
            except Exception as e:
                logger.error(f"Gemini classification failed: {e}. Using fallback.")

        return self._classify_heuristic(image_path)

    def _classify_with_gemini(self, image_path: str) -> dict:
        """Use Gemini Vision API for classification."""
        from PIL import Image
        import google.generativeai as genai

        img = Image.open(image_path)

        response = self._gemini_client.generate_content(
            [CLASSIFICATION_PROMPT, img],
            generation_config=genai.types.GenerationConfig(
                temperature=0.2,
                max_output_tokens=512,
            ),
        )

        text = response.text.strip()
        # Strip markdown code fences if present
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]

        result = json.loads(text)
        result["is_mock"] = False
        result["classifier"] = "gemini-1.5-flash"
        return result

    def _classify_heuristic(self, image_path: str) -> dict:
        """
        Fallback: analyze image color distribution as a simple heuristic.
        In a real deployment, this would use a fine-tuned EfficientNet model.
        For demo purposes, returns a plausible classification based on
        image brightness and dominant color.
        """
        try:
            from PIL import Image
            import numpy as np

            img = Image.open(image_path).convert("RGB")
            img_small = img.resize((64, 64))
            arr = np.array(img_small).astype(float)

            # Simple color channel analysis
            r_mean = arr[:, :, 0].mean()
            g_mean = arr[:, :, 1].mean()
            b_mean = arr[:, :, 2].mean()

            # Heuristic rules based on dominant color
            if b_mean > r_mean and b_mean > g_mean and b_mean > 100:
                label = "water_body"
            elif g_mean > r_mean and g_mean > b_mean and g_mean > 80:
                label = "afforestation"
            elif r_mean > 150 and g_mean > 120 and b_mean < 100:
                label = "check_dam"
            elif r_mean > g_mean and r_mean > b_mean:
                label = "soil_erosion"
            else:
                label = "contour_bund"

        except Exception:
            label = "other"

        return {
            "label": label,
            "confidence": 0.72,
            "display_label": ACTIVITY_LABELS[label],
            "description": (
                f"This image appears to show a {ACTIVITY_LABELS[label]} site. "
                "The structure appears to be in the implementation or maintenance phase. "
                "Geo-coded field verification is recommended for accurate classification."
            ),
            "condition": "fair",
            "recommendations": [
                "Conduct field verification to confirm classification accuracy.",
                "Compare with baseline satellite imagery to assess intervention impact.",
            ],
            "is_mock": True,
            "classifier": "heuristic-fallback",
        }


# ── Module-level singleton ─────────────────────────────────────────────────
_classifier_instance: Optional[WatershedImageClassifier] = None


def get_classifier() -> WatershedImageClassifier:
    global _classifier_instance
    if _classifier_instance is None:
        _classifier_instance = WatershedImageClassifier()
    return _classifier_instance


def classify_image(image_path: str) -> dict:
    """Convenience function to classify a single image."""
    return get_classifier().classify(image_path)


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python inference.py <image_path>")
        sys.exit(1)

    result = classify_image(sys.argv[1])
    print(json.dumps(result, indent=2))
