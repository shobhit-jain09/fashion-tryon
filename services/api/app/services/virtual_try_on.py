from __future__ import annotations

import time
import uuid
from datetime import datetime, timezone

from pydantic import TypeAdapter

from app.schemas import Product, TryOnRequest, TryOnResult, TryOnResponse
from app.services.replicate_provider import (
    ReplicateProviderError,
    create_prediction,
    fetch_prediction,
)
from app.services.try_on_products import resolve_garment_and_products
from app.settings import settings

# MVP in-memory store. Replace with Redis + DB in production.
JOBS: dict[str, dict] = {}

_product_list_adapter = TypeAdapter(list[Product])


def _dump_products(products: list[Product]) -> list:
    return [item.model_dump(mode="json") for item in products]


def _load_products(raw: list) -> list[Product]:
    return _product_list_adapter.validate_python(raw)


def create_try_on_job(payload: TryOnRequest) -> TryOnResponse:
    job_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc)
    garment_url, products = resolve_garment_and_products(payload)
    products_payload = _dump_products(products)

    provider = settings.ai_provider.strip().lower()

    if provider == "replicate":
        try:
            prediction = create_prediction(
                api_token=settings.ai_provider_api_key,
                model_version=settings.replicate_model_version,
                person_image_url=str(payload.person_image_url),
                style_prompt=payload.style_prompt,
                garment_image_url=garment_url,
            )
            JOBS[job_id] = {
                "provider": "replicate",
                "prediction_id": prediction.get("id"),
                "products_payload": products_payload,
            }
            initial_status = prediction.get("status", "queued")
            if initial_status not in {"queued", "processing", "completed", "failed"}:
                initial_status = "queued"
            return TryOnResponse(job_id=job_id, status=initial_status, created_at=created_at)
        except ReplicateProviderError as exc:
            JOBS[job_id] = {"provider": "replicate", "error_message": str(exc)}
            return TryOnResponse(job_id=job_id, status="failed", created_at=created_at)

    JOBS[job_id] = {
        "provider": "mock",
        "created_ts": time.time(),
        "result_image": f"https://picsum.photos/seed/{job_id}/900/1200",
        "products_payload": products_payload,
    }
    return TryOnResponse(job_id=job_id, status="queued", created_at=created_at)


def get_try_on_job(job_id: str) -> TryOnResult:
    job = JOBS.get(job_id)
    if not job:
        return TryOnResult(job_id=job_id, status="failed", error_message="Job not found")

    products = _load_products(job.get("products_payload") or [])

    if job.get("provider") == "replicate":
        if job.get("error_message"):
            return TryOnResult(job_id=job_id, status="failed", error_message=job["error_message"])
        prediction_id = job.get("prediction_id")
        if not prediction_id:
            return TryOnResult(job_id=job_id, status="failed", error_message="Missing prediction id")
        try:
            prediction = fetch_prediction(
                api_token=settings.ai_provider_api_key,
                prediction_id=prediction_id,
            )
        except ReplicateProviderError as exc:
            return TryOnResult(job_id=job_id, status="failed", error_message=str(exc))

        status = prediction.get("status", "processing")
        if status in {"starting", "queued"}:
            return TryOnResult(job_id=job_id, status="queued")
        if status in {"processing"}:
            return TryOnResult(job_id=job_id, status="processing")
        if status in {"failed", "canceled"}:
            return TryOnResult(
                job_id=job_id,
                status="failed",
                error_message=prediction.get("error", "Replicate prediction failed"),
            )

        output = prediction.get("output")
        image_url = None
        if isinstance(output, list) and output:
            image_url = output[0]
        elif isinstance(output, str):
            image_url = output

        if not image_url:
            return TryOnResult(
                job_id=job_id,
                status="failed",
                error_message="Replicate completed without image output",
            )
        return TryOnResult(
            job_id=job_id,
            status="completed",
            generated_image_url=image_url,
            products=products,
        )

    elapsed = time.time() - job["created_ts"]
    if elapsed < 2:
        return TryOnResult(job_id=job_id, status="queued")
    if elapsed < 5:
        return TryOnResult(job_id=job_id, status="processing")

    return TryOnResult(
        job_id=job_id,
        status="completed",
        generated_image_url=job["result_image"],
        products=products,
    )
