from __future__ import annotations

from typing import Any

import httpx

from app.settings import settings


class ReplicateProviderError(Exception):
    pass


def create_prediction(
    *,
    api_token: str,
    model_version: str,
    person_image_url: str,
    style_prompt: str,
    garment_image_url: str | None = None,
) -> dict[str, Any]:
    if not api_token:
        raise ReplicateProviderError("Missing AI_PROVIDER_API_KEY for Replicate")
    if not model_version:
        raise ReplicateProviderError("Missing REPLICATE_MODEL_VERSION in environment")

    person_key = settings.replicate_input_person_key.strip() or "image"
    prompt_key = settings.replicate_input_prompt_key.strip() or "prompt"
    garment_key = settings.replicate_input_garment_key.strip() or "garment"

    model_input: dict[str, Any] = {
        person_key: person_image_url,
        prompt_key: style_prompt,
    }
    if garment_image_url:
        model_input[garment_key] = garment_image_url

    payload = {
        "version": model_version,
        "input": model_input,
    }
    headers = {
        "Authorization": f"Token {api_token}",
        "Content-Type": "application/json",
    }

    response = httpx.post(
        "https://api.replicate.com/v1/predictions",
        headers=headers,
        json=payload,
        timeout=30.0,
    )
    if response.status_code >= 400:
        raise ReplicateProviderError(
            f"Replicate create prediction failed: {response.status_code} {response.text}"
        )
    return response.json()


def fetch_prediction(*, api_token: str, prediction_id: str) -> dict[str, Any]:
    if not api_token:
        raise ReplicateProviderError("Missing AI_PROVIDER_API_KEY for Replicate")
    headers = {"Authorization": f"Token {api_token}"}
    response = httpx.get(
        f"https://api.replicate.com/v1/predictions/{prediction_id}",
        headers=headers,
        timeout=30.0,
    )
    if response.status_code >= 400:
        raise ReplicateProviderError(
            f"Replicate fetch prediction failed: {response.status_code} {response.text}"
        )
    return response.json()
