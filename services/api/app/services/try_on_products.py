from __future__ import annotations

from app.schemas import Product, SelectedProductPick, TryOnRequest
from app.services import catalog


def pick_to_product(pick: SelectedProductPick) -> Product:
    return Product(
        id=pick.id,
        title=pick.title,
        brand=pick.brand,
        price=pick.price,
        currency=pick.currency,
        retailer=pick.retailer,
        image_url=pick.image_url,
        purchase_url=pick.purchase_url,
    )


def _fallback_products(category: str) -> list[Product]:
    return [
        Product(
            id="placeholder-1",
            title=f"{category.title()} — browse on Myntra",
            brand="Myntra",
            price=0,
            currency="INR",
            retailer="myntra",
            image_url="https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80",
            purchase_url="https://www.myntra.com/",
        ),
        Product(
            id="placeholder-2",
            title=f"{category.title()} — browse on Flipkart",
            brand="Flipkart",
            price=0,
            currency="INR",
            retailer="flipkart",
            image_url="https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=800&q=80",
            purchase_url="https://www.flipkart.com/",
        ),
    ]


def resolve_garment_and_products(payload: TryOnRequest) -> tuple[str | None, list[Product]]:
    """Returns garment image URL for VTO (if any) and the product list to show after generation."""
    category = payload.category
    selected_product: Product | None = None

    if payload.selected_product:
        selected_product = pick_to_product(payload.selected_product)
    elif payload.selected_product_id:
        selected_product = catalog.get_by_id(payload.selected_product_id)

    garment_url = str(selected_product.image_url) if selected_product else None

    base = catalog.list_catalog(category=category, limit=10, flipkart_query=None)
    if selected_product:
        rest = [p for p in base if p.id != selected_product.id]
        products = [selected_product, *rest[:5]]
    else:
        products = base[:6]

    if not products:
        products = _fallback_products(category)
    return garment_url, products
