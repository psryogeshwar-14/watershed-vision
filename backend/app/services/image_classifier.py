"""
app/services/image_classifier.py
──────────────────────────────────
Classify field photographs using Google Gemini Vision API.

When GEMINI_API_KEY is not configured the service falls back to a
deterministic mock classification so the rest of the platform can operate
without a live API connection.
"""

from __future__ import annotations

import base64
import json
import logging
import random
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from app.core.config import settings

logger = logging.getLogger(__name__)

# ── Classification result dataclass ──────────────────────────────────────────

@dataclass
class ClassificationResult:
    label: str                           # maps to ActivityType enum value
    confidence: float                    # 0.0 – 1.0
    description: str
    recommendations: str
    is_mock: bool = False


# ── Prompt ────────────────────────────────────────────────────────────────────

_SYSTEM_PROMPT = """
You are an expert in watershed management and rural land conservation for 
the Indian subcontinent (Maharashtra focus). Analyse the provided field 
photograph and classify the primary land intervention or observation visible.

Respond ONLY with a JSON object containing exactly these keys:
  "label"           : one of [check_dam, contour_bund, afforestation,
                              water_body, soil_erosion, drainage, other]
  "confidence"      : float between 0.0 and 1.0
  "description"     : 2-3 sentence factual description of what you see
  "recommendations" : 1-2 actionable maintenance or improvement suggestions

Rules:
- Be conservative: if unsure, lower confidence and use "other".
- Focus on watershed health indicators visible in the image.
- Keep descriptions objective and field-report style.
- Return valid JSON only, no markdown fences.
""".strip()

# ── Mock data ─────────────────────────────────────────────────────────────────

_MOCK_CLASSIFICATIONS = [
    ClassificationResult(
        label="check_dam",
        confidence=0.87,
        description=(
            "A stone masonry check dam is visible across a seasonal nala. "
            "The structure appears to be in good condition with water ponding "
            "upstream, indicating effective water retention."
        ),
        recommendations=(
            "Inspect the spillway for scouring after each monsoon season. "
            "Consider planting vetiver grass on the downstream slope for erosion protection."
        ),
        is_mock=True,
    ),
    ClassificationResult(
        label="contour_bund",
        confidence=0.82,
        description=(
            "Earthen contour bunds are visible on a gently sloping agricultural "
            "field. The bunds follow the land contours and appear recently maintained."
        ),
        recommendations=(
            "Fill any gaps or breaches in the bunds before the monsoon. "
            "Plant perennial grasses on bund tops to increase stability."
        ),
        is_mock=True,
    ),
    ClassificationResult(
        label="afforestation",
        confidence=0.79,
        description=(
            "Newly planted saplings in rows indicate a recent afforestation effort "
            "on a degraded hillslope. Tree guards are present around saplings."
        ),
        recommendations=(
            "Ensure adequate gap-filling for saplings lost to dry spells. "
            "Mulch around each sapling to conserve soil moisture."
        ),
        is_mock=True,
    ),
    ClassificationResult(
        label="soil_erosion",
        confidence=0.91,
        description=(
            "Severe rill and gully erosion is evident on bare soil slopes. "
            "The topsoil layer appears to have been stripped over a significant area."
        ),
        recommendations=(
            "Immediately install brushwood check dams in gullies to halt further erosion. "
            "Plan for grass seeding and contour trenching in the next planting season."
        ),
        is_mock=True,
    ),
    ClassificationResult(
        label="water_body",
        confidence=0.94,
        description=(
            "A percolation tank / farm pond is visible with adequate storage. "
            "Water surface shows minimal turbidity and vegetation encroachment is limited."
        ),
        recommendations=(
            "De-silt the pond before next monsoon to restore storage capacity. "
            "Establish a buffer zone of native vegetation around the bund."
        ),
        is_mock=True,
    ),
]


# ── Service ───────────────────────────────────────────────────────────────────

class ImageClassifier:
    """
    Watershed activity classifier backed by Gemini Vision API with a
    graceful mock fallback.
    """

    def __init__(self) -> None:
        self._client = None
        self._model_name = "gemini-1.5-flash"

        if settings.gemini_configured:
            self._init_client()

    def _init_client(self) -> bool:
        """Initialise Gemini client using configured API key."""
        try:
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self._client = genai.GenerativeModel(
                model_name=self._model_name,
                system_instruction=_SYSTEM_PROMPT,
            )
            logger.info("Gemini Vision client initialised (model=%s)", self._model_name)
            return True
        except Exception as exc:
            logger.warning("Failed to initialise Gemini client: %s", exc)
            self._client = None
            return False

    def _ensure_client(self) -> bool:
        """Ensure client is ready if gemini_configured has become true."""
        if self._client is not None:
            return True
        if settings.gemini_configured:
            return self._init_client()
        return False

    # ── Public API ────────────────────────────────────────────────────────

    async def classify_image(self, image_path: str | Path) -> ClassificationResult:
        """
        Classify a field photograph.

        Args:
            image_path: Absolute path to the saved image file.

        Returns:
            :class:`ClassificationResult` with label, confidence, description,
            recommendations, and is_mock flag.
        """
        if not self._ensure_client():
            logger.debug("Gemini not configured – returning mock classification")
            return self._mock_classify(image_path)

        try:
            return await self._gemini_classify(Path(image_path))
        except Exception as exc:
            logger.error("Gemini classification failed: %s – falling back to mock", exc)
            return self._mock_classify(image_path)

    # ── Private helpers ───────────────────────────────────────────────────

    async def _gemini_classify(self, path: Path) -> ClassificationResult:
        """Call Gemini Vision API with the image bytes."""
        import google.generativeai as genai

        # Read and encode image
        img_bytes = path.read_bytes()
        suffix = path.suffix.lower().lstrip(".")
        mime_map = {
            "jpg": "image/jpeg",
            "jpeg": "image/jpeg",
            "png": "image/png",
            "heic": "image/heic",
            "heif": "image/heif",
            "webp": "image/webp",
        }
        mime_type = mime_map.get(suffix, "image/jpeg")

        image_part = {
            "mime_type": mime_type,
            "data": base64.b64encode(img_bytes).decode(),
        }

        response = self._client.generate_content(
            contents=[
                image_part,
                "Classify this watershed field photograph as instructed.",
            ],
            generation_config={
                "temperature": 0.2,
                "top_p": 0.95,
                "max_output_tokens": 512,
            },
        )

        raw_text = response.text.strip()
        # Extract JSON object substring
        if "{" in raw_text and "}" in raw_text:
            start = raw_text.find("{")
            end = raw_text.rfind("}") + 1
            raw_text = raw_text[start:end]

        parsed = json.loads(raw_text)

        # Validate label
        valid_labels = {
            "check_dam", "contour_bund", "afforestation",
            "water_body", "soil_erosion", "drainage", "other",
        }
        label = parsed.get("label", "other").lower()
        if label not in valid_labels:
            label = "other"

        return ClassificationResult(
            label=label,
            confidence=max(0.0, min(1.0, float(parsed.get("confidence", 0.5)))),
            description=str(parsed.get("description", "")),
            recommendations=str(parsed.get("recommendations", "")),
            is_mock=False,
        )

    @staticmethod
    def _mock_classify(image_path: str | Path) -> ClassificationResult:
        """
        Return a pseudo-random mock result seeded by the filename so the
        same image always gets the same mock label.
        """
        seed = sum(ord(c) for c in str(image_path))
        rng = random.Random(seed)
        return rng.choice(_MOCK_CLASSIFICATIONS)


# ── Module-level singleton ────────────────────────────────────────────────────
image_classifier = ImageClassifier()
