#!/usr/bin/env python3
"""
WatershedVision — API Key & Service Verification Utility
────────────────────────────────────────────────────────
Checks whether optional API keys (Google Gemini & Google Earth Engine)
are properly configured, tests live connectivity, and verifies graceful
mock fallback when keys are absent.

Usage:
    python scripts/verify_api_keys.py
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

# Add backend to sys.path so we can import app modules
BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(BACKEND_DIR))

# Attempt to load settings from app or directly from backend/.env
def load_env_dict() -> dict[str, str]:
    """Parse backend/.env using standard library as fallback."""
    env_vars: dict[str, str] = {}
    env_path = BACKEND_DIR / ".env"
    if env_path.is_file():
        for line in env_path.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, val = line.split("=", 1)
                env_vars[key.strip()] = val.strip()
    return env_vars

_env_dict = load_env_dict()

try:
    from app.core.config import settings
    gemini_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY") or _env_dict.get("GEMINI_API_KEY", "")
    gee_sa = settings.GEE_SERVICE_ACCOUNT or os.getenv("GEE_SERVICE_ACCOUNT") or _env_dict.get("GEE_SERVICE_ACCOUNT", "")
    gee_key = settings.GEE_KEY_FILE or os.getenv("GEE_KEY_FILE") or _env_dict.get("GEE_KEY_FILE", "")
    gee_project = settings.GEE_PROJECT_ID or os.getenv("GEE_PROJECT_ID") or _env_dict.get("GEE_PROJECT_ID", "")
except Exception:
    gemini_key = os.getenv("GEMINI_API_KEY") or _env_dict.get("GEMINI_API_KEY", "")
    gee_sa = os.getenv("GEE_SERVICE_ACCOUNT") or _env_dict.get("GEE_SERVICE_ACCOUNT", "")
    gee_key = os.getenv("GEE_KEY_FILE") or _env_dict.get("GEE_KEY_FILE", "")
    gee_project = os.getenv("GEE_PROJECT_ID") or _env_dict.get("GEE_PROJECT_ID", "")


def verify_gemini() -> dict[str, str | bool]:
    """Check Gemini Vision API configuration and connectivity."""
    has_key = bool(gemini_key and gemini_key.strip() and not gemini_key.startswith("AIza..."))
    result: dict[str, str | bool] = {
        "configured": has_key,
        "live": False,
        "message": "",
    }

    if not has_key:
        result["message"] = "No GEMINI_API_KEY found. Running in MOCK MODE (deterministic heuristic classifier)."
        return result

    try:
        import google.generativeai as genai

        genai.configure(api_key=gemini_key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content("Respond with 'OK' if you can read this.")
        if response and response.text:
            result["live"] = True
            result["message"] = f"Successfully connected to Gemini Vision API! Response: {response.text.strip()[:20]}"
        else:
            result["message"] = "Gemini API responded with empty output."
    except Exception as exc:
        result["message"] = f"Gemini API connection error: {exc}"

    return result


def verify_gee() -> dict[str, str | bool]:
    """Check Google Earth Engine configuration and connectivity."""
    has_sa = bool(gee_sa and gee_key and os.path.isfile(gee_key))
    has_project = bool(gee_project and gee_project.strip())
    has_adc = bool(os.getenv("GOOGLE_APPLICATION_CREDENTIALS") and os.path.isfile(os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "")))
    is_configured = has_sa or has_project or has_adc

    result: dict[str, str | bool] = {
        "configured": is_configured,
        "live": False,
        "message": "",
    }

    if not is_configured:
        result["message"] = "No GEE credentials/project configured. Running in MOCK MODE (synthetic Sentinel-2 rasters)."
        return result

    try:
        import ee

        if has_sa:
            credentials = ee.ServiceAccountCredentials(gee_sa, gee_key)
            ee.Initialize(credentials)
            result["message"] = f"GEE initialised with Service Account: {gee_sa}"
        elif has_project:
            ee.Initialize(project=gee_project.strip())
            result["message"] = f"GEE initialised with Project ID: {gee_project}"
        else:
            ee.Initialize()
            result["message"] = "GEE initialised with default credentials."

        # Quick test: check Sentinel-2 image collection
        s2 = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED").limit(1)
        count = s2.size().getInfo()
        result["live"] = True
        result["message"] += f" (Successfully queried Sentinel-2 collection, count={count})"
    except Exception as exc:
        result["message"] = f"GEE connection error: {exc}"

    return result


def main() -> None:
    print("=" * 65)
    print(" 🛰️  WatershedVision — API Key & Service Diagnostics")
    print("=" * 65)
    print(f"Loaded config from: {BACKEND_DIR / '.env'}")
    print()

    # 1. Gemini
    print("1. Google Gemini Vision API (Field Image AI Classifier):")
    gemini_res = verify_gemini()
    status_icon = "✅ LIVE" if gemini_res["live"] else ("⚠️  MOCK MODE" if not gemini_res["configured"] else "❌ ERROR")
    print(f"   Status  : {status_icon}")
    print(f"   Details : {gemini_res['message']}")
    print()

    # 2. GEE
    print("2. Google Earth Engine (Sentinel-2 Satellite Processor):")
    gee_res = verify_gee()
    gee_icon = "✅ LIVE" if gee_res["live"] else ("⚠️  MOCK MODE" if not gee_res["configured"] else "❌ ERROR")
    print(f"   Status  : {gee_icon}")
    print(f"   Details : {gee_res['message']}")
    print()

    print("-" * 65)
    print(" Summary:")
    print(f"  • AI Image Classification : {'Real Gemini Vision' if gemini_res['live'] else 'Synthetic / Deterministic Mock'}")
    print(f"  • Satellite Analytics     : {'Live Sentinel-2 (GEE)' if gee_res['live'] else 'Synthetic NumPy Rasters (Mock)'}")
    print("-" * 65)

    if not gemini_res["live"] or not gee_res["live"]:
        print()
        print("💡 How to enable LIVE features:")
        if not gemini_res["live"]:
            print("  • For Gemini: Get a free key at https://aistudio.google.com/ and set GEMINI_API_KEY in backend/.env")
        if not gee_res["live"]:
            print("  • For GEE: Set GEE_PROJECT_ID in backend/.env (after running `earthengine authenticate`)")
            print("    or provide GEE_SERVICE_ACCOUNT and GEE_KEY_FILE.")
        print()
    else:
        print("🎉 All services are fully LIVE and operational!")
        print()


if __name__ == "__main__":
    main()
