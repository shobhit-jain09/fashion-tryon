from __future__ import annotations

from typing import Any

import httpx

from app.schemas import Product
from app.settings import settings


class FlipkartAffiliateError(Exception):
    pass


def _first_image_url(image_urls: Any) -> str | None:
    if isinstance(image_urls, str):
        return image_urls
    if isinstance(image_urls, dict):
        for _k, v in sorted(image_urls.items(), key=lambda x: x[0], reverse=True):
            if isinstance(v, str) and v.startswith("http"):
                return v
    return None


def _product_url(raw: Any) -> str | None:
    if isinstance(raw, str):
        return raw
    if isinstance(raw, dict):
        url = raw.get("url") or raw.get("value")
        if isinstance(url, str):
            return url
    return None


def _parse_flipkart_products(payload: dict[str, Any]) -> list[Product]:
    raw_list = payload.get("products") or payload.get("ProductInfoList") or []
    if not isinstance(raw_list, list):
        return []

    products: list[Product] = []
    for item in raw_list:
        if not isinstance(item, dict):
            continue
        base = item.get("productBaseInfoV1") or item.get("productInfo") or item
        if not isinstance(base, dict):
            continue
        pid = str(base.get("productId") or base.get("product_id") or "") or None
        title = str(base.get("title") or base.get("name") or "Flipkart product")
        brand = str(base.get("brand") or base.get("brandName") or "Flipkart")
        image_url = _first_image_url(base.get("imageUrls") or base.get("imageUrl"))
        purchase_raw = base.get("productUrl") or base.get("product_url")
        purchase_url = _product_url(purchase_raw) or "https://www.flipkart.com"

        price = 0.0
        price_block = (
            item.get("productShippingInfoV1")
            or item.get("price")
            or base.get("flipkartSellingPrice")
            or base.get("productPrice")
        )
        if isinstance(price_block, dict):
            amt = price_block.get("amount") or price_block.get("value")
            if isinstance(amt, (int, float)):
                price = float(amt)

        if not image_url:
            continue

        products.append(
            Product(
                id=f"flipkart-{pid or title[:24]}",
                title=title[:200],
                brand=brand[:120],
                price=price,
                currency="INR",
                retailer="flipkart",
                image_url=image_url,
                purchase_url=purchase_url,
            )
        )
    return products


def search_products(*, query: str, result_count: int = 10) -> list[Product]:
    affiliate_id = settings.flipkart_affiliate_id.strip()
    token = settings.flipkart_affiliate_token.strip()
    if not affiliate_id or not token:
        raise FlipkartAffiliateError("Flipkart affiliate id/token not configured")

    count = max(1, min(result_count, 10))
    url = settings.flipkart_search_url.strip() or "https://affiliate-api.flipkart.net/affiliate/1.0/search.json"
    headers = {
        "Fk-Affiliate-Id": affiliate_id,
        "Fk-Affiliate-Token": token,
        "Accept": "application/json",
    }
    response = httpx.get(
        url,
        headers=headers,
        params={"query": query, "resultCount": count},
        timeout=30.0,
    )
    if response.status_code >= 400:
        raise FlipkartAffiliateError(
            f"Flipkart search failed: {response.status_code} {response.text[:500]}"
        )
    try:
        payload = response.json()
    except ValueError as exc:
        raise FlipkartAffiliateError("Flipkart search returned non-JSON") from exc
    return _parse_flipkart_products(payload if isinstance(payload, dict) else {})
