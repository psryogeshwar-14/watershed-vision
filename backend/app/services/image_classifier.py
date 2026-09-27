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
    structural_integrity_score: float = 85.0  # 0 - 100%
    siltation_level: str = "Low (<15%)"
    capacity_retention_pct: float = 90.0
    maintenance_urgency: str = "Routine"
    is_mock: bool = False


# ── Prompt ────────────────────────────────────────────────────────────────────

_SYSTEM_PROMPT = """
You are an expert watershed civil engineer and rural conservation specialist 
for India's Ministry of Rural Development (WDC-PMKSY / DoLR guidelines). 
Analyse the provided field photograph of a watershed development structure.

Respond ONLY with a valid JSON object containing exactly these keys:
  "label"                      : one of [check_dam, contour_bund, afforestation,
                                         water_body, soil_erosion, drainage, other]
  "confidence"                 : float between 0.0 and 1.0
  "description"                : 2-3 sentence factual civil-engineering description
  "recommendations"            : 1-2 actionable maintenance or desilting suggestions
  "structural_integrity_score" : float between 0.0 and 100.0 (structural soundness)
  "siltation_level"            : one of ["Low (<15%)", "Moderate (15-40%)", "Severe (>40%)"]
  "capacity_retention_pct"     : float between 0.0 and 100.0 (effective storage volume left)
  "maintenance_urgency"        : one of ["Routine", "Pre-Monsoon Inspection", "Immediate Action Required"]

Rules:
- Be conservative: if erosion or cracks are visible, lower integrity score.
- Keep descriptions objective and technical (civil / agro-forestry terms).
- Return valid JSON only, no markdown fences.
""".strip()

# ── Mock data ─────────────────────────────────────────────────────────────────

_MOCK_CLASSIFICATIONS = [
    ClassificationResult(
        label="check_dam",
        confidence=0.94,
        description=(
            "A stone masonry check dam is visible across a seasonal nala. "
            "Structure shows sound headwall with slight sediment ponding upstream."
        ),
        recommendations=(
            "Inspect spillway for scouring after monsoon. Plant vetiver grass along the banks."
        ),
        structural_integrity_score=88.5,
        siltation_level="Low (<15%)",
        capacity_retention_pct=92.0,
        maintenance_urgency="Routine",
        is_mock=True,
    ),
    ClassificationResult(
        label="contour_bund",
        confidence=0.88,
        description=(
            "Earthen contour bunds and continuous contour trenches (CCT) along agricultural slopes. "
            "Bund geometry conforms to contour interval with intact cross-sections."
        ),
        recommendations=(
            "Fill minor gaps before onset of monsoon. Plant stylosanthes grass on bund tops."
        ),
        structural_integrity_score=82.0,
        siltation_level="Moderate (15-40%)",
        capacity_retention_pct=78.5,
        maintenance_urgency="Pre-Monsoon Inspection",
        is_mock=True,
    ),
    ClassificationResult(
        label="afforestation",
        confidence=0.92,
        description=(
            "Community plantation and afforestation plot on degraded slopes. "
            "Native tree saplings (Neem, Subabul) display over 85% survival rate with mulch."
        ),
        recommendations=(
            "Ensure regular gap filling for perished saplings. Maintain drip lines or pot watering."
        ),
        structural_integrity_score=90.0,
        siltation_level="Low (<15%)",
        capacity_retention_pct=95.0,
        maintenance_urgency="Routine",
        is_mock=True,
    ),
    ClassificationResult(
        label="soil_erosion",
        confidence=0.95,
        description=(
            "Active severe rill and gully erosion on unbunded agricultural slope. "
            "Topsoil layer stripped, threatening downstream siltation."
        ),
        recommendations=(
            "Install immediate brushwood check dams and loose boulder structures. Plan for CCT next season."
        ),
        structural_integrity_score=35.0,
        siltation_level="Severe (>40%)",
        capacity_retention_pct=25.0,
        maintenance_urgency="Immediate Action Required",
        is_mock=True,
    ),
    ClassificationResult(
        label="water_body",
        confidence=0.96,
        description=(
            "Farm pond (Khet Talav) lined with HDPE geomembrane with clear water catchment. "
            "Riparian embankment shows adequate freeboard above full supply level."
        ),
        recommendations=(
            "De-silt inlet silt trap before next monsoon. Maintain protective fence around pond perimeter."
        ),
        structural_integrity_score=94.0,
        siltation_level="Low (<15%)",
        capacity_retention_pct=91.0,
        maintenance_urgency="Routine",
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

        integrity = float(parsed.get("structural_integrity_score", 85.0))
        silt_level = str(parsed.get("siltation_level", "Low (<15%)"))
        capacity = float(parsed.get("capacity_retention_pct", 90.0))
        urgency = str(parsed.get("maintenance_urgency", "Routine"))

        return ClassificationResult(
            label=label,
            confidence=max(0.0, min(1.0, float(parsed.get("confidence", 0.5)))),
            description=str(parsed.get("description", "")),
            recommendations=str(parsed.get("recommendations", "")),
            structural_integrity_score=max(0.0, min(100.0, integrity)),
            siltation_level=silt_level,
            capacity_retention_pct=max(0.0, min(100.0, capacity)),
            maintenance_urgency=urgency,
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
