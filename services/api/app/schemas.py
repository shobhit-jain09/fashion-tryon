from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, HttpUrl


class Product(BaseModel):
    id: str
    title: str
    brand: str
    price: float
    currency: str = "USD"
    image_url: HttpUrl
    purchase_url: HttpUrl


class TryOnRequest(BaseModel):
    person_image_url: HttpUrl
    style_prompt: str
    category: Literal["casual", "formal", "streetwear", "sportswear"] = "casual"


class TryOnResponse(BaseModel):
    job_id: str
    status: Literal["queued", "processing", "completed", "failed"]
    created_at: datetime


class TryOnResult(BaseModel):
    job_id: str
    status: Literal["queued", "processing", "completed", "failed"]
    generated_image_url: HttpUrl | None = None
    products: list[Product] = []
    error_message: str | None = None
