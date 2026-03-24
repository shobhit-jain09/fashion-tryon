from __future__ import annotations

import time
import uuid
from datetime import datetime, timezone

from app.schemas import Product, TryOnRequest, TryOnResult, TryOnResponse

# MVP in-memory store. Replace with Redis + DB in production.
JOBS: dict[str, dict] = {}


def _build_products(category: str) -> list[Product]:
    return [
        Product(
            id="sku-001",
            title=f"{category.title()} Trend Jacket",
            brand="UrbanForm",
            price=79.99,
            image_url="https://picsum.photos/seed/jacket/400/400",
            purchase_url="https://example-shop.com/products/trend-jacket",
        ),
        Product(
            id="sku-002",
            title=f"{category.title()} Slim Pants",
            brand="ModeLine",
            price=54.50,
            image_url="https://picsum.photos/seed/pants/400/400",
            purchase_url="https://example-shop.com/products/slim-pants",
        ),
        Product(
            id="sku-003",
            title=f"{category.title()} Sneakers",
            brand="StreetLoop",
            price=92.00,
            image_url="https://picsum.photos/seed/sneakers/400/400",
            purchase_url="https://example-shop.com/products/sneakers",
        ),
    ]


def create_try_on_job(payload: TryOnRequest) -> TryOnResponse:
    job_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc)
    JOBS[job_id] = {
        "created_ts": time.time(),
        "category": payload.category,
        "result_image": f"https://picsum.photos/seed/{job_id}/900/1200",
    }
    return TryOnResponse(job_id=job_id, status="queued", created_at=created_at)


def get_try_on_job(job_id: str) -> TryOnResult:
    job = JOBS.get(job_id)
    if not job:
        return TryOnResult(job_id=job_id, status="failed", error_message="Job not found")

    elapsed = time.time() - job["created_ts"]
    if elapsed < 2:
        return TryOnResult(job_id=job_id, status="queued")
    if elapsed < 5:
        return TryOnResult(job_id=job_id, status="processing")

    return TryOnResult(
        job_id=job_id,
        status="completed",
        generated_image_url=job["result_image"],
        products=_build_products(job["category"]),
    )
