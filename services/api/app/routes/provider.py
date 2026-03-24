from fastapi import APIRouter

from app.settings import settings

router = APIRouter(prefix="/v1/provider", tags=["provider"])


@router.get("/status")
def provider_status() -> dict:
    provider = settings.ai_provider.strip().lower() or "mock"
    has_api_key = bool(settings.ai_provider_api_key)
    has_model_version = bool(settings.replicate_model_version)

    configured = provider == "mock" or (provider == "replicate" and has_api_key and has_model_version)
    warnings: list[str] = []

    if provider == "replicate":
        if not has_api_key:
            warnings.append("AI_PROVIDER_API_KEY is missing")
        if not has_model_version:
            warnings.append("REPLICATE_MODEL_VERSION is missing")

    return {
        "provider": provider,
        "configured": configured,
        "has_api_key": has_api_key,
        "has_model_version": has_model_version,
        "warnings": warnings,
    }
