from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, HttpUrl


class Product(BaseModel):
    id: str
    title: str
    brand: str
    price: float
    currency: str = "INR"
    image_url: HttpUrl
    purchase_url: HttpUrl
    retailer: str | None = None


class SelectedProductPick(BaseModel):
    """Send when the chosen dress came from Flipkart search or another client-side list."""

    id: str
    title: str
    brand: str = "Brand"
    price: float = 0
    currency: str = "INR"
    image_url: HttpUrl
    purchase_url: HttpUrl
    retailer: str | None = None


class TryOnRequest(BaseModel):
    person_image_url: HttpUrl
    style_prompt: str
    category: Literal["casual", "formal", "streetwear", "sportswear"] = "casual"
    selected_product_id: str | None = None
    selected_product: SelectedProductPick | None = None


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
