from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import ValidationError

from app.schemas import Product
from app.services.flipkart_affiliate import FlipkartAffiliateError, search_products
from app.settings import settings


Category = Literal["casual", "formal", "streetwear", "sportswear"]


def _catalog_path() -> Path:
    raw = settings.catalog_json_path.strip()
    if raw:
        return Path(raw)
    return Path(__file__).resolve().parent.parent / "data" / "catalog.json"


@lru_cache(maxsize=1)
def _load_local_products() -> list[dict]:
    path = _catalog_path()
    if not path.is_file():
        return []
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return []
    items = data.get("products")
    if not isinstance(items, list):
        return []
    return [item for item in items if isinstance(item, dict)]


def clear_catalog_cache() -> None:
    _load_local_products.cache_clear()


def _dict_to_product(row: dict) -> Product | None:
    try:
        return Product(
            id=str(row["id"]),
            title=str(row["title"]),
            brand=str(row.get("brand") or "Brand"),
            price=float(row.get("price") or 0),
            currency=str(row.get("currency") or "INR"),
            retailer=row.get("retailer"),
            image_url=row["image_url"],
            purchase_url=row["purchase_url"],
        )
    except (KeyError, ValueError, ValidationError, TypeError):
        return None


def list_local_by_category(category: Category, limit: int = 12) -> list[Product]:
    rows = _load_local_products()
    out: list[Product] = []
    for row in rows:
        cats = row.get("categories") or []
        if not isinstance(cats, list) or category not in cats:
            continue
        product = _dict_to_product(row)
        if product:
            out.append(product)
        if len(out) >= limit:
            break
    return out


def list_local_all(limit: int = 50) -> list[Product]:
    rows = _load_local_products()
    out: list[Product] = []
    for row in rows:
        product = _dict_to_product(row)
        if product:
            out.append(product)
        if len(out) >= limit:
            break
    return out


def get_by_id(product_id: str) -> Product | None:
    for row in _load_local_products():
        if str(row.get("id")) == product_id:
            return _dict_to_product(row)
    return None


def list_catalog(
    *,
    category: Category,
    limit: int = 12,
    retailer: str | None = None,
    flipkart_query: str | None = None,
) -> list[Product]:
    local = list_local_by_category(category, limit=limit)
    if retailer:
        r = retailer.strip().lower()
        local = [p for p in local if (p.retailer or "").lower() == r]

    if flipkart_query and flipkart_query.strip():
        try:
            remote = search_products(query=flipkart_query.strip(), result_count=10)
            merged = list(local)
            seen = {p.id for p in merged}
            for item in remote:
                if item.id in seen:
                    continue
                merged.append(item)
                seen.add(item.id)
                if len(merged) >= limit:
                    break
            return merged[:limit]
        except FlipkartAffiliateError:
            return local
    return local[:limit]
