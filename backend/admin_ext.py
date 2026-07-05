"""
Enterprise Admin extension - all new endpoints for the enterprise admin panel.
Attached to the main FastAPI app in server.py.
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from typing import Any, List, Optional, Dict
import os, uuid, csv, io, shutil, mimetypes
from datetime import datetime, timezone, timedelta
from pathlib import Path

from motor.motor_asyncio import AsyncIOMotorDatabase

# These are provided by server.py at import time via set_context()
_db: AsyncIOMotorDatabase = None
_require_admin = None
_require_super = None
_current_user = None
_now = None
_uid = None

admin_router = APIRouter(prefix="/api/admin")

UPLOAD_DIR = Path(__file__).parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)


def set_context(db, require_admin, require_super, current_user, now, uid):
    global _db, _require_admin, _require_super, _current_user, _now, _uid
    _db = db
    _require_admin = require_admin
    _require_super = require_super
    _current_user = current_user
    _now = now
    _uid = uid


# ==================== MODELS ====================
class KV(BaseModel):
    key: str
    value: Any


class StoreSettings(BaseModel):
    name: str = "Mangalore Store"
    tagline: str = "Farm-fresh groceries, delivered daily"
    logo: str = ""
    logo_dark: str = ""
    logo_mobile: str = ""
    favicon: str = ""
    loading_logo: str = ""
    email: str = "hello@mangalorestore.com"
    phone: str = "+91 98450 00000"
    whatsapp: str = "+91 98450 00000"
    address: str = "12 MG Road, Mangalore, Karnataka 575001, India"
    google_maps: str = ""
    gst_number: str = "29ABCDE1234F1Z5"
    company_name: str = "Mangalore Commerce Pvt Ltd"
    footer_copyright: str = "© 2026 Mangalore Store. All rights reserved."


class ThemeSettings(BaseModel):
    primary: str = "#1B4332"
    secondary: str = "#E07A5F"
    accent: str = "#F4A261"
    background: str = "#FDFBF7"
    text: str = "#1C1917"
    button_radius: int = 999   # px
    card_radius: int = 16
    font_display: str = "Cabinet Grotesk"
    font_body: str = "Satoshi"
    dark_mode: bool = False
    product_layout: str = "grid"       # grid | list
    category_layout: str = "bento"     # bento | grid | carousel


class AnnouncementBar(BaseModel):
    enabled: bool = True
    text: str = "Free delivery on orders over ₹499 · Same-day delivery in Mangalore"
    link: str = ""
    bg: str = "#1B4332"
    fg: str = "#FFFFFF"


class HeaderConfig(BaseModel):
    show_search: bool = True
    show_wishlist: bool = True
    show_cart: bool = True
    show_login: bool = True
    show_language: bool = False
    show_currency: bool = False
    contact_number_visible: bool = True
    menu_id: Optional[str] = None
    announcement: AnnouncementBar = Field(default_factory=AnnouncementBar)


class FooterColumn(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    links: List[Dict[str, str]] = []  # [{label, url}]


class FooterConfig(BaseModel):
    logo: str = ""
    description: str = "Farm-fresh groceries sourced daily from local Mangalore farmers, delivered to your door in 30 minutes."
    columns: List[FooterColumn] = []
    socials: List[Dict[str, str]] = []  # [{platform, url}]
    show_newsletter: bool = True
    policies: List[Dict[str, str]] = []  # [{label, url}]
    copyright: str = "© 2026 Mangalore Store. All rights reserved."


class HomepageSection(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    key: str            # hero | categories | flash | featured | trending | brands | banner | video | testimonials | blog | newsletter | app
    title: str = ""
    enabled: bool = True
    order: int = 0
    config: Dict[str, Any] = {}


class MenuItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    label: str
    url: str = ""
    icon: str = ""
    order: int = 0
    children: List["MenuItem"] = []
    is_mega: bool = False


MenuItem.model_rebuild()


class Menu(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    location: str = "header"  # header | footer | mobile
    items: List[MenuItem] = []


class Brand(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    slug: str
    logo: str = ""
    banner: str = ""
    description: str = ""
    status: str = "active"
    created_at: str = ""


class Discount(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    type: str  # percentage | fixed | bogo | bundle | flash | happy_hour | category | brand | product | automatic | coupon
    value: float = 0.0
    max_discount: float = 0.0
    min_order: float = 0.0
    code: Optional[str] = None            # for coupon type
    target_ids: List[str] = []            # products/categories/brands ids
    starts_at: Optional[str] = None
    ends_at: Optional[str] = None
    active: bool = True
    priority: int = 0
    created_at: str = ""


class BannerV2(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    subtitle: str = ""
    image: str
    link_type: str = "url"    # url | product | category
    link_value: str = ""
    placement: str = "hero"   # hero | sidebar | strip | popup
    active: bool = True
    starts_at: Optional[str] = None
    ends_at: Optional[str] = None
    order: int = 0
    created_at: str = ""


class Warehouse(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    address: str = ""
    city: str = ""
    is_default: bool = False


class CMSPage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    key: str            # about | privacy | terms | refund | shipping | contact | faq | career | help | custom
    slug: str
    title: str
    content: str = ""
    seo_title: str = ""
    seo_description: str = ""
    status: str = "published"  # draft | published
    updated_at: str = ""


class BlogPost(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    slug: str
    title: str
    excerpt: str = ""
    content: str = ""
    cover: str = ""
    tags: List[str] = []
    author: str = ""
    status: str = "draft"       # draft | published
    published_at: Optional[str] = None
    created_at: str = ""


class NotificationTemplate(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    key: str
    channel: str      # email | sms | push | whatsapp
    subject: str = ""
    body: str = ""
    enabled: bool = True


class Role(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    key: str          # super_admin | admin | manager | seller | staff | support | custom
    permissions: List[str] = []
    is_system: bool = False


# ==================== HELPERS ====================
async def _get_singleton(coll_name: str, defaults: dict) -> dict:
    doc = await _db[coll_name].find_one({"_id": "singleton"})
    if not doc:
        doc = {"_id": "singleton", **defaults}
        await _db[coll_name].insert_one(doc)
    doc.pop("_id", None)
    return doc


async def _put_singleton(coll_name: str, body: dict) -> dict:
    await _db[coll_name].update_one({"_id": "singleton"}, {"$set": body}, upsert=True)
    return await _get_singleton(coll_name, body)


# ==================== SETTINGS ====================
@admin_router.get("/settings/store")
async def get_store_settings():
    return await _get_singleton("store_settings", StoreSettings().model_dump())


@admin_router.put("/settings/store")
async def put_store_settings(body: StoreSettings):
    return await _put_singleton("store_settings", body.model_dump())


@admin_router.get("/settings/theme")
async def get_theme():
    return await _get_singleton("theme_settings", ThemeSettings().model_dump())


@admin_router.put("/settings/theme")
async def put_theme(body: ThemeSettings):
    return await _put_singleton("theme_settings", body.model_dump())


@admin_router.get("/settings/header")
async def get_header():
    return await _get_singleton("header_config", HeaderConfig().model_dump())


@admin_router.put("/settings/header")
async def put_header(body: HeaderConfig):
    return await _put_singleton("header_config", body.model_dump())


@admin_router.get("/settings/footer")
async def get_footer():
    return await _get_singleton("footer_config", FooterConfig().model_dump())


@admin_router.put("/settings/footer")
async def put_footer(body: FooterConfig):
    return await _put_singleton("footer_config", body.model_dump())


# Generic key-value bucket settings (taxes, shipping, payments, email, sms, whatsapp, analytics, seo, api_keys)
ALLOWED_KV = {"tax", "shipping", "payments", "email", "sms", "whatsapp", "analytics", "seo", "integrations", "social"}


@admin_router.get("/settings/{key}")
async def get_kv(key: str):
    if key not in ALLOWED_KV:
        raise HTTPException(404, "Unknown settings key")
    doc = await _db.kv_settings.find_one({"key": key}, {"_id": 0})
    return doc.get("value", {}) if doc else {}


@admin_router.put("/settings/{key}")
async def put_kv(key: str, body: Dict[str, Any]):
    if key not in ALLOWED_KV:
        raise HTTPException(404, "Unknown settings key")
    await _db.kv_settings.update_one({"key": key}, {"$set": {"value": body}}, upsert=True)
    return body


# ==================== HOMEPAGE BUILDER ====================
@admin_router.get("/homepage")
async def get_homepage():
    docs = await _db.homepage_sections.find({}, {"_id": 0}).sort("order", 1).to_list(200)
    return docs


@admin_router.put("/homepage")
async def put_homepage(body: List[HomepageSection]):
    await _db.homepage_sections.delete_many({})
    for i, s in enumerate(body):
        d = s.model_dump()
        d["order"] = i
        await _db.homepage_sections.insert_one(d)
    return await _db.homepage_sections.find({}, {"_id": 0}).sort("order", 1).to_list(200)


# ==================== MENUS ====================
@admin_router.get("/menus")
async def list_menus():
    return await _db.menus.find({}, {"_id": 0}).to_list(50)


@admin_router.post("/menus")
async def create_menu(body: Menu):
    doc = body.model_dump()
    await _db.menus.insert_one(doc)
    doc.pop("_id", None)
    return doc


@admin_router.put("/menus/{mid}")
async def update_menu(mid: str, body: Menu):
    updates = body.model_dump(exclude={"id"})
    await _db.menus.update_one({"id": mid}, {"$set": updates})
    return await _db.menus.find_one({"id": mid}, {"_id": 0})


@admin_router.delete("/menus/{mid}")
async def delete_menu(mid: str):
    await _db.menus.delete_one({"id": mid})
    return {"ok": True}


# ==================== BRANDS ====================
@admin_router.get("/brands")
async def list_brands():
    return await _db.brands.find({}, {"_id": 0}).to_list(500)


@admin_router.post("/brands")
async def create_brand(body: Brand):
    body.slug = body.slug or body.name.lower().replace(" ", "-")
    body.created_at = _now()
    doc = body.model_dump()
    await _db.brands.insert_one(doc)
    doc.pop("_id", None)
    return doc


@admin_router.put("/brands/{bid}")
async def update_brand(bid: str, body: Brand):
    await _db.brands.update_one({"id": bid}, {"$set": body.model_dump(exclude={"id"})})
    return await _db.brands.find_one({"id": bid}, {"_id": 0})


@admin_router.delete("/brands/{bid}")
async def delete_brand(bid: str):
    await _db.brands.delete_one({"id": bid})
    return {"ok": True}


# ==================== DISCOUNTS ====================
@admin_router.get("/discounts")
async def list_discounts():
    return await _db.discounts.find({}, {"_id": 0}).sort("priority", -1).to_list(500)


@admin_router.post("/discounts")
async def create_discount(body: Discount):
    body.created_at = _now()
    doc = body.model_dump()
    await _db.discounts.insert_one(doc)
    doc.pop("_id", None)
    return doc


@admin_router.put("/discounts/{did}")
async def update_discount(did: str, body: Discount):
    await _db.discounts.update_one({"id": did}, {"$set": body.model_dump(exclude={"id"})})
    return await _db.discounts.find_one({"id": did}, {"_id": 0})


@admin_router.delete("/discounts/{did}")
async def delete_discount(did: str):
    await _db.discounts.delete_one({"id": did})
    return {"ok": True}


# ==================== BANNERS V2 ====================
@admin_router.get("/banners")
async def list_banners_admin():
    return await _db.banners.find({}, {"_id": 0}).sort("order", 1).to_list(200)


@admin_router.post("/banners")
async def create_banner(body: BannerV2):
    body.created_at = _now()
    doc = body.model_dump()
    await _db.banners.insert_one(doc)
    doc.pop("_id", None)
    return doc


@admin_router.put("/banners/{bid}")
async def update_banner(bid: str, body: BannerV2):
    await _db.banners.update_one({"id": bid}, {"$set": body.model_dump(exclude={"id"})})
    return await _db.banners.find_one({"id": bid}, {"_id": 0})


@admin_router.delete("/banners/{bid}")
async def delete_banner(bid: str):
    await _db.banners.delete_one({"id": bid})
    return {"ok": True}


# ==================== WAREHOUSES ====================
@admin_router.get("/warehouses")
async def list_warehouses():
    return await _db.warehouses.find({}, {"_id": 0}).to_list(200)


@admin_router.post("/warehouses")
async def create_warehouse(body: Warehouse):
    doc = body.model_dump()
    await _db.warehouses.insert_one(doc)
    doc.pop("_id", None)
    return doc


@admin_router.put("/warehouses/{wid}")
async def update_warehouse(wid: str, body: Warehouse):
    await _db.warehouses.update_one({"id": wid}, {"$set": body.model_dump(exclude={"id"})})
    return await _db.warehouses.find_one({"id": wid}, {"_id": 0})


@admin_router.delete("/warehouses/{wid}")
async def delete_warehouse(wid: str):
    await _db.warehouses.delete_one({"id": wid})
    return {"ok": True}


# ==================== INVENTORY ====================
@admin_router.get("/inventory/low-stock")
async def low_stock(threshold: int = 10):
    return await _db.products.find({"stock": {"$lte": threshold}}, {"_id": 0}).sort("stock", 1).to_list(500)


class StockUpdate(BaseModel):
    product_id: str
    stock: int


@admin_router.post("/inventory/bulk")
async def bulk_stock(updates: List[StockUpdate]):
    for u in updates:
        await _db.products.update_one({"id": u.product_id}, {"$set": {"stock": u.stock}})
    return {"updated": len(updates)}


# ==================== PRODUCTS - enhanced admin CRUD ====================
class ProductAdminIn(BaseModel):
    name: str
    slug: Optional[str] = None
    description: str = ""
    highlights: List[str] = []
    price: float
    mrp: float
    cost_price: float = 0.0
    tax_pct: float = 0.0
    category_id: str
    brand: str = ""
    brand_id: Optional[str] = None
    sku: Optional[str] = None
    barcode: str = ""
    unit: str = "1 unit"
    stock: int = 100
    min_qty: int = 1
    max_qty: int = 20
    weight: float = 0.0
    dimensions: str = ""
    images: List[str] = []
    videos: List[str] = []
    tags: List[str] = []
    variants: List[Dict[str, Any]] = []
    seo_title: str = ""
    seo_description: str = ""
    seo_keywords: str = ""
    is_featured: bool = False
    is_trending: bool = False
    is_flash_sale: bool = False
    status: str = "active"        # active | draft | archived
    visibility: str = "public"    # public | hidden


@admin_router.post("/products")
async def admin_create_product(body: ProductAdminIn):
    cat = await _db.categories.find_one({"id": body.category_id}, {"_id": 0})
    doc = body.model_dump(exclude_none=True)
    doc.setdefault("slug", body.name.lower().replace(" ", "-"))
    doc.setdefault("sku", f"SKU-{_uid()[:8].upper()}")
    doc["id"] = _uid()
    doc["category_name"] = cat["name"] if cat else ""
    doc["rating"] = 4.5
    doc["review_count"] = 0
    doc["seller_id"] = "house"
    doc["seller_store_name"] = "Mangalore Store"
    doc["created_at"] = _now()
    await _db.products.insert_one(doc)
    doc.pop("_id", None)
    return doc


@admin_router.put("/products/{pid}")
async def admin_update_product(pid: str, body: ProductAdminIn):
    updates = body.model_dump(exclude_none=True)
    cat = await _db.categories.find_one({"id": body.category_id}, {"_id": 0})
    if cat:
        updates["category_name"] = cat["name"]
    await _db.products.update_one({"id": pid}, {"$set": updates})
    return await _db.products.find_one({"id": pid}, {"_id": 0})


@admin_router.delete("/products/{pid}")
async def admin_delete_product(pid: str):
    await _db.products.delete_one({"id": pid})
    return {"ok": True}


@admin_router.post("/products/{pid}/duplicate")
async def duplicate_product(pid: str):
    p = await _db.products.find_one({"id": pid}, {"_id": 0})
    if not p:
        raise HTTPException(404, "Product not found")
    p["id"] = _uid()
    p["name"] = p["name"] + " (Copy)"
    p["slug"] = p["slug"] + "-copy-" + _uid()[:4]
    p["sku"] = f"SKU-{_uid()[:8].upper()}"
    p["created_at"] = _now()
    await _db.products.insert_one(p)
    p.pop("_id", None)
    return p


class BulkDelete(BaseModel):
    ids: List[str]


@admin_router.post("/products/bulk-delete")
async def bulk_delete_products(body: BulkDelete):
    r = await _db.products.delete_many({"id": {"$in": body.ids}})
    return {"deleted": r.deleted_count}


@admin_router.get("/products/export.csv")
async def export_products_csv():
    from fastapi.responses import PlainTextResponse
    docs = await _db.products.find({}, {"_id": 0}).to_list(5000)
    buf = io.StringIO()
    fields = ["id", "name", "slug", "sku", "category_name", "brand", "price", "mrp", "cost_price",
              "stock", "unit", "tags", "is_featured", "is_trending", "is_flash_sale", "status"]
    w = csv.DictWriter(buf, fieldnames=fields, extrasaction="ignore")
    w.writeheader()
    for d in docs:
        d["tags"] = ",".join(d.get("tags", []) or [])
        w.writerow(d)
    return PlainTextResponse(buf.getvalue(), media_type="text/csv")


@admin_router.post("/products/import")
async def import_products_csv(file: UploadFile = File(...)):
    text = (await file.read()).decode("utf-8", errors="ignore")
    reader = csv.DictReader(io.StringIO(text))
    imported = 0
    errors = []
    async for _ in _iter_empty():
        pass  # noqa
    for i, row in enumerate(reader, 1):
        try:
            cat = None
            cat_name = row.get("category_name", "").strip()
            if cat_name:
                cat = await _db.categories.find_one({"name": cat_name}, {"_id": 0})
            doc = {
                "id": _uid(),
                "name": row["name"].strip(),
                "slug": row.get("slug") or row["name"].strip().lower().replace(" ", "-"),
                "description": row.get("description", ""),
                "sku": row.get("sku") or f"SKU-{_uid()[:8].upper()}",
                "brand": row.get("brand", ""),
                "unit": row.get("unit", "1 unit"),
                "price": float(row.get("price") or 0),
                "mrp": float(row.get("mrp") or 0),
                "cost_price": float(row.get("cost_price") or 0),
                "stock": int(row.get("stock") or 0),
                "images": [row["image"]] if row.get("image") else [],
                "tags": [t.strip() for t in (row.get("tags") or "").split(",") if t.strip()],
                "category_id": cat["id"] if cat else "",
                "category_name": cat_name,
                "seller_id": "house",
                "seller_store_name": "Mangalore Store",
                "rating": 4.5, "review_count": 0,
                "is_featured": (row.get("is_featured") or "").lower() in ("1","true","yes"),
                "is_trending": (row.get("is_trending") or "").lower() in ("1","true","yes"),
                "is_flash_sale": (row.get("is_flash_sale") or "").lower() in ("1","true","yes"),
                "status": row.get("status", "active"),
                "created_at": _now(),
            }
            await _db.products.insert_one(doc)
            imported += 1
        except Exception as e:
            errors.append({"row": i, "error": str(e)})
    return {"imported": imported, "errors": errors}


async def _iter_empty():  # small helper to keep code linear
    if False:
        yield 1


# ==================== CATEGORIES ENHANCED ====================
class CategoryAdmin(BaseModel):
    id: Optional[str] = None
    name: str
    slug: str
    icon: str = ""
    image: str = ""
    banner: str = ""
    parent_id: Optional[str] = None
    sort_order: int = 0
    seo_title: str = ""
    seo_description: str = ""


@admin_router.get("/categories")
async def admin_list_categories():
    return await _db.categories.find({}, {"_id": 0}).sort("sort_order", 1).to_list(500)


@admin_router.post("/categories")
async def admin_create_category(body: CategoryAdmin):
    doc = body.model_dump()
    doc["id"] = body.id or _uid()
    await _db.categories.insert_one(doc)
    doc.pop("_id", None)
    return doc


@admin_router.put("/categories/{cid}")
async def admin_update_category(cid: str, body: CategoryAdmin):
    await _db.categories.update_one({"id": cid}, {"$set": body.model_dump(exclude={"id"})})
    return await _db.categories.find_one({"id": cid}, {"_id": 0})


@admin_router.delete("/categories/{cid}")
async def admin_delete_category(cid: str):
    await _db.categories.delete_one({"id": cid})
    return {"ok": True}


# ==================== REVIEWS MODERATION ====================
@admin_router.get("/reviews")
async def list_reviews(status: Optional[str] = None):
    q = {}
    if status:
        q["moderation_status"] = status
    revs = await _db.reviews.find(q, {"_id": 0}).sort("created_at", -1).to_list(1000)
    # enrich with product name
    for r in revs:
        p = await _db.products.find_one({"id": r["product_id"]}, {"_id": 0, "name": 1, "images": 1})
        r["product_name"] = p.get("name") if p else ""
        r["product_image"] = (p.get("images") or [None])[0] if p else None
    return revs


class ReviewModIn(BaseModel):
    status: str  # approved | rejected | pending


@admin_router.put("/reviews/{rid}/status")
async def moderate_review(rid: str, body: ReviewModIn):
    await _db.reviews.update_one({"id": rid}, {"$set": {"moderation_status": body.status}})
    return {"ok": True}


class ReviewReplyIn(BaseModel):
    reply: str


@admin_router.post("/reviews/{rid}/reply")
async def reply_review(rid: str, body: ReviewReplyIn):
    await _db.reviews.update_one({"id": rid}, {"$set": {"admin_reply": body.reply, "admin_reply_at": _now()}})
    return {"ok": True}


@admin_router.delete("/reviews/{rid}")
async def delete_review(rid: str):
    await _db.reviews.delete_one({"id": rid})
    return {"ok": True}


# ==================== CMS PAGES ====================
@admin_router.get("/cms")
async def list_cms():
    return await _db.cms_pages.find({}, {"_id": 0}).to_list(500)


@admin_router.post("/cms")
async def create_cms(body: CMSPage):
    body.updated_at = _now()
    doc = body.model_dump()
    await _db.cms_pages.insert_one(doc)
    doc.pop("_id", None)
    return doc


@admin_router.put("/cms/{pid}")
async def update_cms(pid: str, body: CMSPage):
    body.updated_at = _now()
    await _db.cms_pages.update_one({"id": pid}, {"$set": body.model_dump(exclude={"id"})})
    return await _db.cms_pages.find_one({"id": pid}, {"_id": 0})


@admin_router.delete("/cms/{pid}")
async def delete_cms(pid: str):
    await _db.cms_pages.delete_one({"id": pid})
    return {"ok": True}


# ==================== BLOGS ====================
@admin_router.get("/blogs")
async def list_blogs():
    return await _db.blogs.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)


@admin_router.post("/blogs")
async def create_blog(body: BlogPost):
    body.created_at = _now()
    if body.status == "published":
        body.published_at = _now()
    doc = body.model_dump()
    await _db.blogs.insert_one(doc)
    doc.pop("_id", None)
    return doc


@admin_router.put("/blogs/{bid}")
async def update_blog(bid: str, body: BlogPost):
    updates = body.model_dump(exclude={"id"})
    if body.status == "published" and not body.published_at:
        updates["published_at"] = _now()
    await _db.blogs.update_one({"id": bid}, {"$set": updates})
    return await _db.blogs.find_one({"id": bid}, {"_id": 0})


@admin_router.delete("/blogs/{bid}")
async def delete_blog(bid: str):
    await _db.blogs.delete_one({"id": bid})
    return {"ok": True}


# ==================== MEDIA LIBRARY ====================
@admin_router.post("/media/upload")
async def upload_media(file: UploadFile = File(...), folder: str = Form("uploads")):
    folder_safe = "".join(c for c in folder if c.isalnum() or c in "-_/")
    dest_dir = UPLOAD_DIR / folder_safe
    dest_dir.mkdir(parents=True, exist_ok=True)
    ext = (Path(file.filename).suffix or "").lower()
    fname = f"{_uid()}{ext}"
    dest = dest_dir / fname
    with open(dest, "wb") as f:
        shutil.copyfileobj(file.file, f)
    size = dest.stat().st_size
    mime = mimetypes.guess_type(file.filename)[0] or "application/octet-stream"
    rel = f"/api/uploads/{folder_safe}/{fname}"
    doc = {
        "id": _uid(),
        "filename": file.filename,
        "path": str(dest),
        "url": rel,
        "folder": folder_safe,
        "mime": mime,
        "size": size,
        "created_at": _now(),
    }
    await _db.media.insert_one(doc)
    doc.pop("_id", None)
    return doc


@admin_router.get("/media")
async def list_media(folder: Optional[str] = None):
    q = {}
    if folder:
        q["folder"] = folder
    return await _db.media.find(q, {"_id": 0}).sort("created_at", -1).to_list(1000)


@admin_router.delete("/media/{mid}")
async def delete_media(mid: str):
    doc = await _db.media.find_one({"id": mid}, {"_id": 0})
    if doc:
        try:
            Path(doc["path"]).unlink()
        except Exception:
            pass
        await _db.media.delete_one({"id": mid})
    return {"ok": True}


# ==================== NOTIFICATION TEMPLATES ====================
@admin_router.get("/notifications/templates")
async def list_templates():
    return await _db.notification_templates.find({}, {"_id": 0}).to_list(200)


@admin_router.post("/notifications/templates")
async def create_template(body: NotificationTemplate):
    doc = body.model_dump()
    await _db.notification_templates.insert_one(doc)
    doc.pop("_id", None)
    return doc


@admin_router.put("/notifications/templates/{tid}")
async def update_template(tid: str, body: NotificationTemplate):
    await _db.notification_templates.update_one({"id": tid}, {"$set": body.model_dump(exclude={"id"})})
    return await _db.notification_templates.find_one({"id": tid}, {"_id": 0})


@admin_router.delete("/notifications/templates/{tid}")
async def delete_template(tid: str):
    await _db.notification_templates.delete_one({"id": tid})
    return {"ok": True}


class NotifTest(BaseModel):
    template_id: str
    to: str


@admin_router.post("/notifications/test")
async def test_notification(body: NotifTest):
    """MOCK send — logs to notification_log collection."""
    t = await _db.notification_templates.find_one({"id": body.template_id}, {"_id": 0})
    if not t:
        raise HTTPException(404, "Template not found")
    log = {
        "id": _uid(),
        "template_key": t.get("key"),
        "channel": t.get("channel"),
        "to": body.to,
        "subject": t.get("subject"),
        "body": t.get("body"),
        "status": "mocked",
        "sent_at": _now(),
    }
    await _db.notification_log.insert_one(log)
    log.pop("_id", None)
    return {"ok": True, "mocked": True, "log": log}


# ==================== ROLES / RBAC ====================
ALL_PERMS = [
    "dashboard.view", "products.manage", "orders.manage", "customers.manage",
    "categories.manage", "brands.manage", "banners.manage", "menus.manage",
    "discounts.manage", "cms.manage", "blogs.manage", "media.manage",
    "notifications.manage", "reports.view", "settings.manage", "roles.manage",
    "seller.manage", "reviews.manage", "inventory.manage", "warehouses.manage",
]


@admin_router.get("/permissions")
async def list_permissions():
    return ALL_PERMS


@admin_router.get("/roles")
async def list_roles():
    return await _db.roles.find({}, {"_id": 0}).to_list(200)


@admin_router.post("/roles")
async def create_role(body: Role):
    doc = body.model_dump()
    await _db.roles.insert_one(doc)
    doc.pop("_id", None)
    return doc


@admin_router.put("/roles/{rid}")
async def update_role(rid: str, body: Role):
    await _db.roles.update_one({"id": rid}, {"$set": body.model_dump(exclude={"id"})})
    return await _db.roles.find_one({"id": rid}, {"_id": 0})


@admin_router.delete("/roles/{rid}")
async def delete_role(rid: str):
    doc = await _db.roles.find_one({"id": rid}, {"_id": 0})
    if doc and doc.get("is_system"):
        raise HTTPException(400, "System role cannot be deleted")
    await _db.roles.delete_one({"id": rid})
    return {"ok": True}


# ==================== CUSTOMERS ENHANCED ====================
@admin_router.get("/customers")
async def list_customers():
    users = await _db.users.find({"role": "customer"}, {"_id": 0, "password_hash": 0}).to_list(1000)
    for u in users:
        u["wallet"] = u.get("wallet", 0.0)
        u["points"] = u.get("points", 0)
        u["order_count"] = await _db.orders.count_documents({"user_id": u["id"], "payment_status": "paid"})
    return users


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    wallet: Optional[float] = None
    points: Optional[int] = None
    status: Optional[str] = None       # active | disabled


@admin_router.put("/customers/{cid}")
async def update_customer(cid: str, body: CustomerUpdate):
    updates = {k: v for k, v in body.model_dump(exclude_none=True).items()}
    if updates:
        await _db.users.update_one({"id": cid}, {"$set": updates})
    u = await _db.users.find_one({"id": cid}, {"_id": 0, "password_hash": 0})
    return u


@admin_router.delete("/customers/{cid}")
async def delete_customer(cid: str):
    await _db.users.delete_one({"id": cid, "role": "customer"})
    return {"ok": True}


@admin_router.get("/customers/{cid}/orders")
async def customer_orders(cid: str):
    return await _db.orders.find({"user_id": cid}, {"_id": 0}).sort("created_at", -1).to_list(500)


@admin_router.get("/customers/{cid}/addresses")
async def customer_addresses(cid: str):
    return await _db.addresses.find({"user_id": cid}, {"_id": 0}).to_list(50)


class AdminAddressIn(BaseModel):
    name: str
    phone: str
    line1: str
    line2: str = ""
    city: str
    state: str
    pincode: str
    country: str = "India"
    is_default: bool = False


@admin_router.post("/customers/{cid}/addresses")
async def admin_add_customer_address(cid: str, body: AdminAddressIn):
    doc = body.model_dump()
    doc["id"] = _uid()
    doc["user_id"] = cid
    if doc.get("is_default"):
        await _db.addresses.update_many({"user_id": cid}, {"$set": {"is_default": False}})
    await _db.addresses.insert_one(doc)
    doc.pop("_id", None)
    return doc


@admin_router.put("/customers/{cid}/addresses/{aid}")
async def admin_edit_customer_address(cid: str, aid: str, body: AdminAddressIn):
    doc = body.model_dump()
    doc["user_id"] = cid
    if doc.get("is_default"):
        await _db.addresses.update_many({"user_id": cid}, {"$set": {"is_default": False}})
    await _db.addresses.update_one({"user_id": cid, "id": aid}, {"$set": doc})
    return {"id": aid, **doc}


@admin_router.delete("/customers/{cid}/addresses/{aid}")
async def admin_delete_customer_address(cid: str, aid: str):
    await _db.addresses.delete_one({"user_id": cid, "id": aid})
    return {"ok": True}


# ==================== ORDERS ENHANCED ====================
class OrderUpdate(BaseModel):
    status: Optional[str] = None
    delivery_assignee: Optional[str] = None
    tracking_no: Optional[str] = None
    notes: Optional[str] = None


@admin_router.put("/orders/{oid}")
async def admin_update_order(oid: str, body: OrderUpdate):
    updates = {k: v for k, v in body.model_dump(exclude_none=True).items()}
    updates["updated_at"] = _now()
    await _db.orders.update_one({"id": oid}, {"$set": updates})
    return await _db.orders.find_one({"id": oid}, {"_id": 0})


class RefundIn(BaseModel):
    amount: float
    reason: str = ""


@admin_router.post("/orders/{oid}/refund")
async def refund_order(oid: str, body: RefundIn):
    o = await _db.orders.find_one({"id": oid}, {"_id": 0})
    if not o:
        raise HTTPException(404, "Order not found")
    refund = {"amount": body.amount, "reason": body.reason, "at": _now()}
    await _db.orders.update_one({"id": oid}, {
        "$push": {"refunds": refund},
        "$set": {"status": "refunded", "updated_at": _now()},
    })
    return {"ok": True, "refund": refund}


class ReturnIn(BaseModel):
    items: List[str] = []   # product_ids
    reason: str = ""


@admin_router.post("/orders/{oid}/return")
async def return_order(oid: str, body: ReturnIn):
    ret = {"items": body.items, "reason": body.reason, "at": _now(), "status": "requested"}
    await _db.orders.update_one({"id": oid}, {
        "$push": {"returns": ret},
        "$set": {"updated_at": _now()},
    })
    return {"ok": True, "return": ret}


@admin_router.get("/orders/{oid}/invoice")
async def order_invoice(oid: str):
    o = await _db.orders.find_one({"id": oid}, {"_id": 0})
    if not o:
        raise HTTPException(404, "Order not found")
    store = await _get_singleton("store_settings", StoreSettings().model_dump())
    inv_no = o.get("invoice_no")
    if not inv_no:
        inv_no = f"INV-{datetime.now().year}-{_uid()[:6].upper()}"
        await _db.orders.update_one({"id": oid}, {"$set": {"invoice_no": inv_no}})
        o["invoice_no"] = inv_no
    return {"order": o, "store": store, "invoice_no": inv_no}


# ==================== REPORTS ====================
@admin_router.get("/reports/sales")
async def report_sales(days: int = 30):
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    orders = await _db.orders.find({"payment_status": "paid", "created_at": {"$gte": cutoff}}, {"_id": 0}).to_list(5000)
    by_day = {}
    for o in orders:
        d = o["created_at"][:10]
        by_day.setdefault(d, {"date": d, "orders": 0, "revenue": 0.0})
        by_day[d]["orders"] += 1
        by_day[d]["revenue"] += float(o.get("total", 0))
    series = sorted(by_day.values(), key=lambda x: x["date"])
    return {"total_orders": len(orders), "total_revenue": round(sum(o.get("total", 0) for o in orders), 2), "series": series}


@admin_router.get("/reports/top-products")
async def report_top_products(limit: int = 10):
    orders = await _db.orders.find({"payment_status": "paid"}, {"_id": 0}).to_list(5000)
    counter: Dict[str, Dict[str, Any]] = {}
    for o in orders:
        for it in o.get("items", []):
            pid = it.get("product_id")
            if not pid:
                continue
            counter.setdefault(pid, {"product_id": pid, "name": it.get("name"), "qty": 0, "revenue": 0.0})
            counter[pid]["qty"] += int(it.get("qty", 0))
            counter[pid]["revenue"] += float(it.get("price", 0)) * int(it.get("qty", 0))
    rows = sorted(counter.values(), key=lambda x: x["revenue"], reverse=True)[:limit]
    return rows


@admin_router.get("/reports/customers")
async def report_customers():
    users = await _db.users.find({"role": "customer"}, {"_id": 0}).to_list(5000)
    new_last_30 = 0
    cutoff = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    growth = {}
    for u in users:
        c = u.get("created_at", "")
        if c >= cutoff:
            new_last_30 += 1
        d = c[:10] if c else ""
        if d:
            growth.setdefault(d, {"date": d, "count": 0})
            growth[d]["count"] += 1
    return {
        "total": len(users),
        "new_last_30_days": new_last_30,
        "growth": sorted(growth.values(), key=lambda x: x["date"])[-30:],
    }


@admin_router.get("/reports/seller")
async def report_seller():
    orders = await _db.orders.find({"payment_status": "paid"}, {"_id": 0}).to_list(5000)
    seller_rev = {}
    for o in orders:
        for it in o.get("items", []):
            sid = it.get("seller_id", "house")
            sname = it.get("seller_store_name", "House")
            seller_rev.setdefault(sid, {"seller_id": sid, "store": sname, "revenue": 0.0, "orders": 0, "items": 0})
            seller_rev[sid]["revenue"] += float(it.get("price", 0)) * int(it.get("qty", 0))
            seller_rev[sid]["items"] += int(it.get("qty", 0))
        for sid in {it.get("seller_id", "house") for it in o.get("items", [])}:
            if sid in seller_rev:
                seller_rev[sid]["orders"] += 1
    return sorted(seller_rev.values(), key=lambda x: x["revenue"], reverse=True)


@admin_router.get("/reports/tax")
async def report_tax():
    orders = await _db.orders.find({"payment_status": "paid"}, {"_id": 0}).to_list(5000)
    total_taxable = 0.0
    total_tax = 0.0
    for o in orders:
        for it in o.get("items", []):
            p = await _db.products.find_one({"id": it.get("product_id")}, {"_id": 0, "tax_pct": 1})
            rate = float(p.get("tax_pct", 0)) if p else 0
            gross = float(it.get("price", 0)) * int(it.get("qty", 0))
            tax = gross * rate / (100 + rate) if rate else 0
            total_taxable += gross - tax
            total_tax += tax
    return {"total_taxable": round(total_taxable, 2), "total_tax_collected": round(total_tax, 2)}


@admin_router.get("/reports/profit")
async def report_profit():
    orders = await _db.orders.find({"payment_status": "paid"}, {"_id": 0}).to_list(5000)
    revenue = 0.0
    cogs = 0.0
    for o in orders:
        for it in o.get("items", []):
            revenue += float(it.get("price", 0)) * int(it.get("qty", 0))
            p = await _db.products.find_one({"id": it.get("product_id")}, {"_id": 0, "cost_price": 1})
            cogs += float((p or {}).get("cost_price", 0)) * int(it.get("qty", 0))
    return {"revenue": round(revenue, 2), "cogs": round(cogs, 2), "profit": round(revenue - cogs, 2)}


# ==================== DASHBOARD WIDGETS ====================
@admin_router.get("/dashboard")
async def admin_dashboard():
    now_utc = datetime.now(timezone.utc)
    today_prefix = now_utc.date().isoformat()
    cutoff_30 = (now_utc - timedelta(days=30)).isoformat()

    orders = await _db.orders.find({}, {"_id": 0}).to_list(5000)
    paid = [o for o in orders if o.get("payment_status") == "paid"]
    total_revenue = sum(float(o.get("total", 0)) for o in paid)
    total_sales = len(paid)
    orders_today = [o for o in orders if o.get("created_at", "").startswith(today_prefix)]

    def status_count(s): return sum(1 for o in orders if o.get("status") == s)

    products_count = await _db.products.count_documents({})
    out_of_stock = await _db.products.count_documents({"stock": {"$lte": 0}})
    low_stock = await _db.products.count_documents({"stock": {"$gt": 0, "$lte": 10}})

    active_customers = await _db.users.count_documents({"role": "customer"})
    new_customers = await _db.users.count_documents({"role": "customer", "created_at": {"$gte": cutoff_30}})

    # Sales & Revenue graph (last 30 days)
    by_day = {}
    for o in paid:
        if o.get("created_at", "") < cutoff_30:
            continue
        d = o["created_at"][:10]
        by_day.setdefault(d, {"date": d, "orders": 0, "revenue": 0.0})
        by_day[d]["orders"] += 1
        by_day[d]["revenue"] += float(o.get("total", 0))
    series = sorted(by_day.values(), key=lambda x: x["date"])

    # Customer growth
    users = await _db.users.find({"role": "customer"}, {"_id": 0, "created_at": 1}).to_list(5000)
    growth = {}
    for u in users:
        c = u.get("created_at", "")[:10]
        if c and c >= cutoff_30[:10]:
            growth.setdefault(c, {"date": c, "count": 0})
            growth[c]["count"] += 1
    growth_series = sorted(growth.values(), key=lambda x: x["date"])

    # Top products
    counter = {}
    for o in paid:
        for it in o.get("items", []):
            pid = it.get("product_id")
            if not pid: continue
            counter.setdefault(pid, {"product_id": pid, "name": it.get("name"), "qty": 0, "revenue": 0.0})
            counter[pid]["qty"] += int(it.get("qty", 0))
            counter[pid]["revenue"] += float(it.get("price", 0)) * int(it.get("qty", 0))
    top_products = sorted(counter.values(), key=lambda x: x["revenue"], reverse=True)[:6]

    recent_orders = sorted(orders, key=lambda o: o.get("created_at", ""), reverse=True)[:8]

    # Recent activities: last created items across products/reviews/orders/customers
    activities = []
    for p in (await _db.products.find({}, {"_id": 0, "name": 1, "created_at": 1}).sort("created_at", -1).limit(3).to_list(3)):
        activities.append({"type": "product", "text": f"New product: {p['name']}", "at": p.get("created_at")})
    for u in (await _db.users.find({"role": "customer"}, {"_id": 0, "name": 1, "created_at": 1}).sort("created_at", -1).limit(3).to_list(3)):
        activities.append({"type": "customer", "text": f"New customer: {u['name']}", "at": u.get("created_at")})
    for r in (await _db.reviews.find({}, {"_id": 0, "user_name": 1, "rating": 1, "created_at": 1}).sort("created_at", -1).limit(3).to_list(3)):
        activities.append({"type": "review", "text": f"{r.get('user_name')} left a {r.get('rating')}★ review", "at": r.get("created_at")})
    activities = sorted(activities, key=lambda a: a.get("at") or "", reverse=True)[:8]

    return {
        "total_sales": total_sales,
        "total_revenue": round(total_revenue, 2),
        "orders_today": len(orders_today),
        "pending_orders": status_count("pending"),
        "delivered_orders": status_count("delivered"),
        "cancelled_orders": status_count("cancelled"),
        "confirmed_orders": status_count("confirmed"),
        "shipped_orders": status_count("shipped"),
        "active_customers": active_customers,
        "new_customers_30d": new_customers,
        "total_products": products_count,
        "out_of_stock": out_of_stock,
        "low_stock": low_stock,
        "sales_series": series,
        "growth_series": growth_series,
        "top_products": top_products,
        "recent_orders": recent_orders,
        "activities": activities,
    }


# =====================================================
# Wire real admin dependency at router level (called from server.py).
# =====================================================
def wire_auth(require_admin_dep):
    """Attach the real require_admin dependency to every route in this router."""
    admin_router.dependencies.append(Depends(require_admin_dep))
