from typing import Literal

from fastapi import APIRouter, HTTPException, Query

from app.schemas import Product
from app.services import catalog
from app.services.flipkart_affiliate import FlipkartAffiliateError, search_products

router = APIRouter(prefix="/v1/catalog", tags=["catalog"])

Category = Literal["casual", "formal", "streetwear", "sportswear"]


@router.get("", response_model=list[Product])
def list_catalog_route(
    category: Category = "casual",
    limit: int = Query(default=12, ge=1, le=50),
    retailer: str | None = None,
    flipkart_query: str | None = None,
) -> list[Product]:
    return catalog.list_catalog(
        category=category,
        limit=limit,
        retailer=retailer,
        flipkart_query=flipkart_query,
    )


@router.get("/flipkart-search", response_model=list[Product])
def flipkart_search_route(
    q: str = Query(..., min_length=2, max_length=120),
    limit: int = Query(default=10, ge=1, le=10),
) -> list[Product]:
    try:
        return search_products(query=q.strip(), result_count=limit)
    except FlipkartAffiliateError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
