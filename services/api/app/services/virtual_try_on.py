from __future__ import annotations

import uuid
from datetime import datetime, timezone

from app.schemas import Product, TryOnRequest, TryOnResult, TryOnResponse

# MVP in-memory store. Replace with Redis + DB in production.
JOBS: dict[str, TryOnResult] = {}


def create_try_on_job(payload: TryOnRequest) -> TryOnResponse:
    job_id = str(uuid.uuid4())
    generated = f"https://picsum.photos/seed/{job_id}/900/1200"

    products = [
        Product(
            id="sku-001",
            title=f"{payload.category.title()} Trend Jacket",
            brand="UrbanForm",
            price=79.99,
            image_url="https://picsum.photos/seed/jacket/400/400",
            purchase_url="https://example-shop.com/products/trend-jacket",
        ),
        Product(
            id="sku-002",
            title=f"{payload.category.title()} Slim Pants",
            brand="ModeLine",
            price=54.50,
            image_url="https://picsum.photos/seed/pants/400/400",
            purchase_url="https://example-shop.com/products/slim-pants",
        ),
    ]

    JOBS[job_id] = TryOnResult(
        job_id=job_id,
        status="completed",
        generated_image_url=generated,
        products=products,
    )

    return TryOnResponse(
        job_id=job_id,
        status="queued",
        created_at=datetime.now(timezone.utc),
    )


def get_try_on_job(job_id: str) -> TryOnResult:
    if job_id not in JOBS:
        return TryOnResult(
            job_id=job_id,
            status="failed",
            error_message="Job not found",
        )
    return JOBS[job_id]
